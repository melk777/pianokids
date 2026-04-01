"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SongNote } from "@/lib/songs";
import { midiNoteToName } from "@/hooks/useMIDI";
import type { Difficulty } from "@/lib/songFilters";
import { TIMING_WINDOWS } from "@/lib/songFilters";

/* ── Types ───────────────────────────────────────────── */

interface PianoPlayerProps {
  notes: SongNote[];            // Pre-filtered by difficulty
  bpm: number;
  difficulty: Difficulty;
  activeNotes: Map<number, { note: number; velocity: number; timestamp: number }>;
  isPlaying: boolean;
  getAudioTime: () => number;   // Sync exactly with AudioContext.currentTime
  onScoreUpdate?: (score: number, combo: number, accuracy: number) => void;
  onSongEnd?: () => void;
  onNoteHit?: (midi: number, duration: number, velocity: number) => void;
  onNoteMiss?: (midi: number) => void;
}

/* ── Constants ───────────────────────────────────────── */

const VIEWPORT_SECONDS = 4;
const HIT_ZONE_Y = 85;

/* ── Colors (Neon/Cyberpunk Hand-specific) ───────────── */

const COLORS = {
  rightHand: "rgba(0,234,255,0.55)",       // Cyan / Blue
  rightHandStroke: "#00EAFF",
  leftHand: "rgba(16,185,129,0.55)",       // Emerald / Green
  leftHandStroke: "#10B981",
  
  hitNormal: "rgba(255,255,255,0.7)",      // White flash for hit
  hitStroke: "#FFFFFF",
  
  comboGlow: "rgba(252,211,77,0.8)",       // Amber/Gold
  missed: "rgba(255,0,229,0)",             // Opacity 0 to fade out
  hitZoneLine: "rgba(255,255,255,0.3)",
  grid: "rgba(255,255,255,0.025)",
};

/* ── Component ───────────────────────────────────────── */

export default function PianoPlayer({
  notes,
  difficulty,
  activeNotes,
  isPlaying,
  getAudioTime,
  onScoreUpdate,
  onSongEnd,
  onNoteHit,
  onNoteMiss,
}: PianoPlayerProps) {
  // We decouple rendering from React state for zero-lag 60fps
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [hitEffects, setHitEffects] = useState<
    { id: number; note: number; type: "hit" | "miss" | "perfect"; time: number }[]
  >([]);
  
  // Game states kept in refs to avoid re-renders during the loop
  const gameTimeRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const hitNotesRef = useRef<Set<number>>(new Set());
  const missedNotesRef = useRef<Set<number>>(new Set());
  const animFrameRef = useRef<number>(0);
  const effectIdRef = useRef(0);
  const timingWindow = TIMING_WINDOWS[difficulty];

  // Initialize state when songs change
  useEffect(() => {
    setScore(0);
    setCombo(0);
    setHits(0);
    setMisses(0);
    hitNotesRef.current = new Set();
    missedNotesRef.current = new Set();
    startTimeRef.current = null;
    gameTimeRef.current = 0;
    setRenderTrigger(prev => prev + 1);
  }, [notes]);

  // ── High Performance Render Loop ──────────────────
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = getAudioTime();
    }

    const tick = () => {
      // THE ONLY SOURCE OF TRUTH: Web Audio Context clock
      const rawAudioTime = getAudioTime();
      // Calculate how long since play started
      const elapsed = rawAudioTime - (startTimeRef.current || rawAudioTime);
      gameTimeRef.current = elapsed;

      // Force React to render once per frame (lightweight because of O(1) DOM)
      setRenderTrigger(prev => (prev + 1) % 100);

      // Check for song end
      const lastNote = notes[notes.length - 1];
      if (lastNote && elapsed > lastNote.time + lastNote.duration + 2) {
        onSongEnd?.();
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, getAudioTime, notes, onSongEnd]);

  // ── MIDI Input matching (Polling against gameTimeRef) ──
  useEffect(() => {
    if (!isPlaying) return;
    const gt = gameTimeRef.current;

    activeNotes.forEach((midiNote) => {
      // Find the first eligible note that matches the key
      const matchIdx = notes.findIndex((ns, i) => {
        if (hitNotesRef.current.has(i) || missedNotesRef.current.has(i)) return false;
        if (ns.midi !== midiNote.note) return false;
        return Math.abs(gt - ns.time) <= timingWindow;
      });

      if (matchIdx !== -1) {
        hitNotesRef.current.add(matchIdx);
        const matched = notes[matchIdx];

        setCombo((c) => {
          const newCombo = c + 1;
          const comboMultiplier = Math.floor(newCombo / 5) + 1;
          setScore((s) => s + 100 * comboMultiplier);
          
          // Visual effect
          const eid = effectIdRef.current++;
          const effectType = newCombo >= 10 ? "perfect" : "hit";
          setHitEffects((prev) => [...prev, { id: eid, note: matched.midi, type: effectType, time: Date.now() }]);
          setTimeout(() => setHitEffects((prev) => prev.filter((e) => e.id !== eid)), 800);
          
          return newCombo;
        });
        
        setHits((h) => h + 1);
        onNoteHit?.(matched.midi, matched.duration, matched.velocity ?? 0.8);
      }
    });
  }, [activeNotes, isPlaying, timingWindow, onNoteHit, notes]); // activeNotes reference changes on press

  // ── Missed notes cleanup (O(1) Memory check during render trigger) ──
  useEffect(() => {
    if (!isPlaying) return;
    const gt = gameTimeRef.current;

    notes.forEach((ns, i) => {
      if (hitNotesRef.current.has(i) || missedNotesRef.current.has(i)) return;
      if (gt > ns.time + timingWindow) {
        missedNotesRef.current.add(i);
        setCombo(0);
        setMisses((m) => m + 1);
        onNoteMiss?.(ns.midi);
        
        const eid = effectIdRef.current++;
        setHitEffects((prev) => [...prev, { id: eid, note: ns.midi, type: "miss", time: Date.now() }]);
        setTimeout(() => setHitEffects((prev) => prev.filter((e) => e.id !== eid)), 600);
      }
    });
  }, [renderTrigger, isPlaying, timingWindow, onNoteMiss, notes]);

  // ── Report score ──────────────────────────────────
  const reportScore = useCallback(() => {
    const total = hits + misses;
    const accuracy = total > 0 ? (hits / total) * 100 : 100;
    onScoreUpdate?.(score, combo, accuracy);
  }, [hits, misses, score, combo, onScoreUpdate]);

  useEffect(() => {
    reportScore();
  }, [reportScore]);

  // ── Viewport-windowed rendering (Cleanup / Cull) ──
  const allMidis = Array.from(new Set(notes.map((n) => n.midi))).sort((a, b) => a - b);
  const laneWidth = allMidis.length > 0 ? 100 / allMidis.length : 10;

  function getNoteX(midi: number): number {
    const idx = allMidis.indexOf(midi);
    return idx >= 0 ? idx * laneWidth : 0;
  }

  const speedMultiplier = 1 / VIEWPORT_SECONDS; // Speed derived from viewport constant

  // Filter notes that are completely outside the visible area
  const visibleNotes = notes.map((ns, i) => ({ ...ns, index: i })).filter((ns) => {
    const gt = gameTimeRef.current;
    // Posição Y calculada exatamente como requisitado: y = (time - audioTime) * speed
    const timeDiff = ns.time - gt;
    const normalizedPos = timeDiff * speedMultiplier; 
    const y = HIT_ZONE_Y - normalizedPos * HIT_ZONE_Y;
    const noteHeight = Math.max((ns.duration * speedMultiplier) * HIT_ZONE_Y, 2);
    
    // Cull strict: Remove from DOM if below screen (y > 110)
    return y + noteHeight > -10 && y < 110;
  });

  const comboTier = combo >= 25 ? "legendary" : combo >= 10 ? "streak" : "normal";

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-white/[0.06] bg-black/40 backdrop-blur-sm">
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

        <defs>
          <linearGradient id="hitZoneGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
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

        {/* ── Falling notes (Culling & Rendering) ── */}
        {visibleNotes.map((ns) => {
          const gt = gameTimeRef.current;
          const timeDiff = ns.time - gt;
          const y = HIT_ZONE_Y - (timeDiff * speedMultiplier) * HIT_ZONE_Y;
          const noteHeight = Math.max((ns.duration * speedMultiplier) * HIT_ZONE_Y, 2);

          const isLeftHand = ns.hand === "left";
          const isHit = hitNotesRef.current.has(ns.index);
          const isMissed = missedNotesRef.current.has(ns.index);

          // Cores por mão (Direita = Azul, Esquerda = Verde)
          let fill = isLeftHand ? COLORS.leftHand : COLORS.rightHand;
          let strokeColor = isLeftHand ? COLORS.leftHandStroke : COLORS.rightHandStroke;
          let filterAttr = "none";
          let opacity = 1;

          // Ciclo de vida: Opacity 0 quando morre. Brilha ao acertar.
          if (isHit) {
            fill = comboTier === "normal" ? COLORS.hitNormal : COLORS.comboGlow;
            strokeColor = COLORS.hitStroke;
            filterAttr = "url(#hitGlow)";
            // Fades out immediately starting after hit
            opacity = Math.max(0, 1 - (gt - ns.time) * 3);
          } else if (isMissed) {
            fill = COLORS.missed;
            strokeColor = COLORS.missed;
            opacity = Math.max(0, 0.4 - (gt - ns.time)); // Fade out out of bounds
          }

          if (opacity <= 0) return null; // Complete cleanup before culling completely

          return (
            <g key={ns.index}>
              <rect
                x={getNoteX(ns.midi) + laneWidth * 0.08}
                y={y}
                width={laneWidth * 0.84}
                height={noteHeight}
                rx={0.5}
                fill={fill}
                stroke={strokeColor}
                strokeWidth={0.15}
                opacity={opacity}
                filter={filterAttr}
                className="transition-opacity duration-200"
              />
              {/* Oculta o texto se a nota foi tocada ou está muito pequena */}
              {!isHit && !isMissed && noteHeight > 3 && (
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

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="glass rounded-xl px-4 py-2 border border-white/[0.06]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider">Pontuação</p>
          <p className="text-xl font-bold tabular-nums text-white">{score.toLocaleString()}</p>
        </div>

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
    </div>
  );
}
