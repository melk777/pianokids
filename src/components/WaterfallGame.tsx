"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SongNote } from "@/lib/songs";
import { midiNoteToName } from "@/hooks/useMIDI";
import type { Difficulty } from "@/lib/songFilters";
import { TIMING_WINDOWS } from "@/lib/songFilters";

/* ── Types ───────────────────────────────────────────── */

interface WaterfallGameProps {
  notes: SongNote[];            // Pre-filtered by difficulty
  bpm: number;
  difficulty: Difficulty;
  activeNotes: Map<number, { note: number; velocity: number; timestamp: number }>;
  isPlaying: boolean;
  onScoreUpdate?: (score: number, combo: number, accuracy: number) => void;
  onSongEnd?: () => void;
  onNoteHit?: (midi: number, duration: number, velocity: number) => void;
  onNoteMiss?: (midi: number) => void;
}

interface NoteState extends SongNote {
  id: number;
  hit: boolean;
  missed: boolean;
}

/* ── Constants ───────────────────────────────────────── */

const VIEWPORT_SECONDS = 4;
const HIT_ZONE_Y = 85;

/* ── Colors (Neon/Cyberpunk) ─────────────────────────── */

const COLORS = {
  note: "rgba(0,234,255,0.55)",
  noteStroke: "#00EAFF",
  hitNormal: "rgba(16,185,129,0.7)",       // emerald
  hitStroke: "#10B981",
  hitGlow: "rgba(16,185,129,0.5)",
  comboGlow: "rgba(16,185,129,0.8)",
  missed: "rgba(255,0,229,0.2)",
  missedStroke: "rgba(255,0,229,0.4)",
  hitZone: "rgba(0,234,255,0.15)",
  hitZoneLine: "rgba(0,234,255,0.3)",
  grid: "rgba(255,255,255,0.025)",
  leftHand: "rgba(168,85,247,0.5)",        // purple for LH
  leftHandStroke: "#A855F7",
};

/* ── Component ───────────────────────────────────────── */

export default function WaterfallGame({
  notes,
  bpm,
  difficulty,
  activeNotes,
  isPlaying,
  onScoreUpdate,
  onSongEnd,
  onNoteHit,
  onNoteMiss,
}: WaterfallGameProps) {
  const [gameTime, setGameTime] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [, setMaxCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [noteStates, setNoteStates] = useState<NoteState[]>([]);
  const [hitEffects, setHitEffects] = useState<
    { id: number; note: number; type: "hit" | "miss" | "perfect"; time: number }[]
  >([]);
  const [metronomeBeat, setMetronomeBeat] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const processedNotesRef = useRef<Set<number>>(new Set());
  const effectIdRef = useRef(0);
  const lastBeatRef = useRef(0);
  const timingWindow = TIMING_WINDOWS[difficulty];

  // Initialize note states when notes change
  useEffect(() => {
    setNoteStates(
      notes.map((n, i) => ({ ...n, id: i, hit: false, missed: false }))
    );
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHits(0);
    setMisses(0);
    setGameTime(0);
    processedNotesRef.current = new Set();
    lastBeatRef.current = 0;
  }, [notes]);

  // ── Game loop ─────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;

    startTimeRef.current = performance.now() / 1000 - gameTime;
    const beatInterval = 60 / bpm;

    const tick = () => {
      const now = performance.now() / 1000 - startTimeRef.current;
      setGameTime(now);

      // Metronome pulse
      const beatNum = Math.floor(now / beatInterval);
      if (beatNum > lastBeatRef.current) {
        lastBeatRef.current = beatNum;
        setMetronomeBeat(true);
        setTimeout(() => setMetronomeBeat(false), 120);
      }

      // Song end check
      const lastNote = notes[notes.length - 1];
      if (lastNote && now > lastNote.time + lastNote.duration + 2) {
        onSongEnd?.();
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, notes, bpm, onSongEnd]);

  // ── MIDI input matching ───────────────────────────
  useEffect(() => {
    if (!isPlaying) return;

    activeNotes.forEach((midiNote) => {
      const matchIdx = noteStates.findIndex((ns) => {
        if (ns.hit || ns.missed || processedNotesRef.current.has(ns.id)) return false;
        if (ns.midi !== midiNote.note) return false;
        return Math.abs(gameTime - ns.time) <= timingWindow;
      });

      if (matchIdx !== -1) {
        const matched = noteStates[matchIdx];
        processedNotesRef.current.add(matched.id);

        setNoteStates((prev) =>
          prev.map((ns) => (ns.id === matched.id ? { ...ns, hit: true } : ns))
        );

        const newCombo = combo + 1;
        const comboMultiplier = Math.floor(newCombo / 5) + 1;
        const noteScore = 100 * comboMultiplier;

        setScore((s) => s + noteScore);
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));
        setHits((h) => h + 1);

        // Fire audio callback
        onNoteHit?.(matched.midi, matched.duration, matched.velocity ?? 0.8);

        // Visual effect
        const eid = effectIdRef.current++;
        const effectType = newCombo >= 10 ? "perfect" : "hit";
        setHitEffects((prev) => [...prev, { id: eid, note: matched.midi, type: effectType, time: Date.now() }]);
        setTimeout(() => setHitEffects((prev) => prev.filter((e) => e.id !== eid)), 800);
      }
    });
  }, [activeNotes, isPlaying, gameTime, noteStates, combo, timingWindow, onNoteHit]);

  // ── Missed notes check ────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;

    setNoteStates((prev) =>
      prev.map((ns) => {
        if (ns.hit || ns.missed || processedNotesRef.current.has(ns.id)) return ns;
        if (gameTime > ns.time + timingWindow) {
          processedNotesRef.current.add(ns.id);
          setCombo(0);
          setMisses((m) => m + 1);

          onNoteMiss?.(ns.midi);

          const eid = effectIdRef.current++;
          setHitEffects((prev) => [...prev, { id: eid, note: ns.midi, type: "miss", time: Date.now() }]);
          setTimeout(() => setHitEffects((prev) => prev.filter((e) => e.id !== eid)), 600);

          return { ...ns, missed: true };
        }
        return ns;
      })
    );
  }, [gameTime, isPlaying, timingWindow, onNoteMiss]);

  // ── Report score ──────────────────────────────────
  const reportScore = useCallback(() => {
    const total = hits + misses;
    const accuracy = total > 0 ? (hits / total) * 100 : 100;
    onScoreUpdate?.(score, combo, accuracy);
  }, [hits, misses, score, combo, onScoreUpdate]);

  useEffect(() => {
    reportScore();
  }, [reportScore]);

  // ── Viewport-windowed rendering ───────────────────
  const visibleNotes = noteStates.filter((ns) => {
    const y = getNoteY(ns.time, gameTime);
    const noteHeight = Math.max((ns.duration / VIEWPORT_SECONDS) * HIT_ZONE_Y, 2);
    return y + noteHeight > -10 && y < 110;
  });

  // Lane mapping from visible+nearby notes (use ALL notes for stable layout)
  const allMidis = Array.from(new Set(notes.map((n) => n.midi))).sort((a, b) => a - b);
  const laneWidth = allMidis.length > 0 ? 100 / allMidis.length : 10;

  function getNoteX(midi: number): number {
    const idx = allMidis.indexOf(midi);
    return idx >= 0 ? idx * laneWidth : 0;
  }

  function getNoteY(noteTime: number, gt: number): number {
    const timeDiff = noteTime - gt;
    const normalizedPos = timeDiff / VIEWPORT_SECONDS;
    return HIT_ZONE_Y - normalizedPos * HIT_ZONE_Y;
  }

  // ── Combo tier ────────────────────────────────────
  const comboTier = combo >= 25 ? "legendary" : combo >= 10 ? "streak" : "normal";

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-white/[0.06] bg-black/40 backdrop-blur-sm">
      {/* SVG Waterfall */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Background grid */}
        {allMidis.map((_, i) => (
          <line
            key={`grid-${i}`}
            x1={i * laneWidth} y1={0}
            x2={i * laneWidth} y2={100}
            stroke={COLORS.grid}
            strokeWidth={0.15}
          />
        ))}

        {/* Hit zone glow */}
        <defs>
          <linearGradient id="hitZoneGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,234,255,0)" />
            <stop offset="40%" stopColor="rgba(0,234,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,234,255,0)" />
          </linearGradient>
          <filter id="noteGlow">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hitGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={0} y={HIT_ZONE_Y - 4} width={100} height={8} fill="url(#hitZoneGradient)" />
        <line x1={0} y1={HIT_ZONE_Y} x2={100} y2={HIT_ZONE_Y} stroke={COLORS.hitZoneLine} strokeWidth={0.25} />

        {/* ── Falling notes (viewport-windowed) ── */}
        {visibleNotes.map((ns) => {
          const y = getNoteY(ns.time, gameTime);
          const noteHeight = Math.max((ns.duration / VIEWPORT_SECONDS) * HIT_ZONE_Y, 2);

          const isLeftHand = ns.hand === "left";

          let fill = isLeftHand ? COLORS.leftHand : COLORS.note;
          let strokeColor = isLeftHand ? COLORS.leftHandStroke : COLORS.noteStroke;
          let filterAttr = "url(#noteGlow)";
          let opacity = 1;

          if (ns.hit) {
            fill = comboTier === "normal"
              ? COLORS.hitNormal
              : COLORS.comboGlow;
            strokeColor = COLORS.hitStroke;
            filterAttr = "url(#hitGlow)";
            opacity = 0.6;
          } else if (ns.missed) {
            fill = COLORS.missed;
            strokeColor = COLORS.missedStroke;
            filterAttr = "none";
            opacity = 0.3;
          }

          return (
            <g key={ns.id}>
              <rect
                x={getNoteX(ns.midi) + laneWidth * 0.08}
                y={y}
                width={laneWidth * 0.84}
                height={noteHeight}
                rx={0.5}
                fill={fill}
                stroke={strokeColor}
                strokeWidth={0.12}
                opacity={opacity}
                filter={filterAttr}
              />
              {/* Note label */}
              {!ns.hit && !ns.missed && noteHeight > 3 && (
                <text
                  x={getNoteX(ns.midi) + laneWidth / 2}
                  y={y + noteHeight / 2 + 0.7}
                  textAnchor="middle"
                  fontSize="1.6"
                  fill="white"
                  opacity={0.65}
                  fontFamily="var(--font-geist-mono)"
                >
                  {midiNoteToName(ns.midi)}
                </text>
              )}
            </g>
          );
        })}

        {/* Lane labels */}
        {allMidis.map((midi, i) => (
          <text
            key={`label-${midi}`}
            x={i * laneWidth + laneWidth / 2}
            y={98}
            textAnchor="middle"
            fontSize="1.5"
            fill="rgba(255,255,255,0.15)"
            fontFamily="var(--font-geist-mono)"
          >
            {midiNoteToName(midi)}
          </text>
        ))}
      </svg>

      {/* ── Hit effects overlay ── */}
      <AnimatePresence>
        {hitEffects.map((effect) => (
          <motion.div
            key={effect.id}
            className="absolute pointer-events-none"
            style={{
              top: `${HIT_ZONE_Y}%`,
              left: `${getNoteX(effect.note) + laneWidth / 2}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2.5, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span
              className={`text-sm font-bold ${
                effect.type === "perfect"
                  ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  : effect.type === "hit"
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "text-magenta drop-shadow-[0_0_8px_rgba(255,0,229,0.5)]"
              }`}
            >
              {effect.type === "miss" ? "✗" : effect.type === "perfect" ? "★" : "✓"}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Combo streak banner ── */}
      <AnimatePresence>
        {comboTier === "legendary" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <span className="text-2xl font-black text-emerald-400 tracking-widest uppercase drop-shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse select-none">
              PERFECT STREAK
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Score HUD ── */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="glass rounded-xl px-4 py-2 border border-white/[0.06]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider">Pontuação</p>
          <p className="text-xl font-bold text-cyan tabular-nums">{score.toLocaleString()}</p>
        </div>

        {/* Combo with glow tiers */}
        <div className="glass rounded-xl px-4 py-2 text-center border border-white/[0.06] relative overflow-hidden">
          {comboTier !== "normal" && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 animate-pulse" />
          )}
          <p className="text-[10px] text-white/35 uppercase tracking-wider relative z-10">Combo</p>
          <p
            className={`text-xl font-bold tabular-nums relative z-10 transition-colors ${
              comboTier === "legendary"
                ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                : comboTier === "streak"
                ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                : combo > 0
                ? "text-white"
                : "text-white/30"
            }`}
          >
            {combo}x
          </p>
        </div>

        <div className="glass rounded-xl px-4 py-2 text-right border border-white/[0.06]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider">Precisão</p>
          <p className="text-xl font-bold text-white tabular-nums">
            {hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100}%
          </p>
        </div>
      </div>

      {/* ── Visual Metronome ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
            metronomeBeat
              ? "bg-cyan scale-150 shadow-[0_0_12px_rgba(0,234,255,0.6)]"
              : "bg-white/10 scale-100"
          }`}
        />
        <span className="text-[10px] text-white/20 font-mono tabular-nums">
          {bpm} BPM
        </span>
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
            metronomeBeat
              ? "bg-cyan scale-150 shadow-[0_0_12px_rgba(0,234,255,0.6)]"
              : "bg-white/10 scale-100"
          }`}
        />
      </div>

      {/* ── Difficulty badge ── */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <span className={`text-[10px] font-medium uppercase tracking-widest ${
          difficulty === "pro" ? "text-magenta/50" :
          difficulty === "medium" ? "text-cyan/50" : "text-emerald-400/50"
        }`}>
          {difficulty === "pro" ? "PRO" : difficulty === "medium" ? "MÉDIO" : "INICIANTE"}
        </span>
      </div>
    </div>
  );
}
