"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Song, SongNote } from "@/lib/songs";
import { midiNoteToName} from "@/hooks/useMIDI";

interface WaterfallGameProps {
  song: Song;
  activeNotes: Map<number, { note: number; velocity: number; timestamp: number }>;
  isPlaying: boolean;
  onScoreUpdate?: (score: number, combo: number, accuracy: number) => void;
  onSongEnd?: () => void;
}

interface NoteState extends SongNote {
  id: number;
  hit: boolean;
  missed: boolean;
}

const TIMING_WINDOW = 0.25; // ±250ms tolerance
const VIEWPORT_SECONDS = 4; // How many seconds visible at once
const HIT_ZONE_Y = 85; // % from top where hit zone is

export default function WaterfallGame({
  song,
  activeNotes,
  isPlaying,
  onScoreUpdate,
  onSongEnd,
}: WaterfallGameProps) {
  const [gameTime, setGameTime] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [, setMaxCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [noteStates, setNoteStates] = useState<NoteState[]>([]);
  const [hitEffects, setHitEffects] = useState<{ id: number; note: number; type: "hit" | "miss"; time: number }[]>([]);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const processedNotesRef = useRef<Set<number>>(new Set());
  const effectIdRef = useRef(0);

  // Initialize note states
  useEffect(() => {
    setNoteStates(
      song.notes.map((n, i) => ({ ...n, id: i, hit: false, missed: false }))
    );
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHits(0);
    setMisses(0);
    setGameTime(0);
    processedNotesRef.current = new Set();
  }, [song]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    startTimeRef.current = performance.now() / 1000 - gameTime;

    const tick = () => {
      const now = performance.now() / 1000 - startTimeRef.current;
      setGameTime(now);

      // Check for song end
      const lastNote = song.notes[song.notes.length - 1];
      if (now > lastNote.time + lastNote.duration + 2) {
        onSongEnd?.();
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, song, onSongEnd, gameTime]);

  // Check MIDI input against notes
  useEffect(() => {
    if (!isPlaying) return;

    activeNotes.forEach((midiNote) => {
      // Find the closest unprocessed note that matches this MIDI note
      const matchIdx = noteStates.findIndex((ns) => {
        if (ns.hit || ns.missed || processedNotesRef.current.has(ns.id)) return false;
        if (ns.midi !== midiNote.note) return false;
        const diff = Math.abs(gameTime - ns.time);
        return diff <= TIMING_WINDOW;
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

        const eid = effectIdRef.current++;
        setHitEffects((prev) => [...prev, { id: eid, note: matched.midi, type: "hit", time: Date.now() }]);
        setTimeout(() => {
          setHitEffects((prev) => prev.filter((e) => e.id !== eid));
        }, 600);
      }
    });
  }, [activeNotes, isPlaying, gameTime, noteStates, combo]);

  // Check for missed notes
  useEffect(() => {
    if (!isPlaying) return;

    setNoteStates((prev) =>
      prev.map((ns) => {
        if (ns.hit || ns.missed || processedNotesRef.current.has(ns.id)) return ns;
        if (gameTime > ns.time + TIMING_WINDOW) {
          processedNotesRef.current.add(ns.id);
          setCombo(0);
          setMisses((m) => m + 1);

          const eid = effectIdRef.current++;
          setHitEffects((prev) => [...prev, { id: eid, note: ns.midi, type: "miss", time: Date.now() }]);
          setTimeout(() => {
            setHitEffects((prev) => prev.filter((e) => e.id !== eid));
          }, 600);

          return { ...ns, missed: true };
        }
        return ns;
      })
    );
  }, [gameTime, isPlaying]);

  // Report score
  useEffect(() => {
    const total = hits + misses;
    const accuracy = total > 0 ? (hits / total) * 100 : 100;
    onScoreUpdate?.(score, combo, accuracy);
  }, [score, combo, hits, misses, onScoreUpdate]);

  // Calculate note position (unique MIDI notes in song for lane mapping)
  const uniqueNotes = Array.from(new Set(song.notes.map((n) => n.midi))).sort((a, b) => a - b);
  const laneWidth = 100 / uniqueNotes.length;

  const getNoteX = (midi: number): number => {
    const idx = uniqueNotes.indexOf(midi);
    return idx * laneWidth;
  };

  const getNoteY = (noteTime: number): number => {
    const timeDiff = noteTime - gameTime;
    const normalizedPos = timeDiff / VIEWPORT_SECONDS;
    return HIT_ZONE_Y - normalizedPos * HIT_ZONE_Y;
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden glass">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Background grid lines */}
        {uniqueNotes.map((_, i) => (
          <line
            key={`grid-${i}`}
            x1={i * laneWidth}
            y1={0}
            x2={i * laneWidth}
            y2={100}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={0.2}
          />
        ))}

        {/* Hit zone line */}
        <line
          x1={0}
          y1={HIT_ZONE_Y}
          x2={100}
          y2={HIT_ZONE_Y}
          stroke="rgba(0,234,255,0.2)"
          strokeWidth={0.3}
        />
        <rect
          x={0}
          y={HIT_ZONE_Y - 1.5}
          width={100}
          height={3}
          fill="rgba(0,234,255,0.05)"
          rx={0.5}
        />

        {/* Falling notes */}
        {noteStates.map((ns) => {
          const y = getNoteY(ns.time);
          const noteHeight = Math.max((ns.duration / VIEWPORT_SECONDS) * HIT_ZONE_Y, 2);

          // Only render if visible
          if (y + noteHeight < -10 || y > 105) return null;

          let fill = "rgba(0,234,255,0.6)";
          let strokeColor = "#00EAFF";
          if (ns.hit) {
            fill = "rgba(0,234,255,0.15)";
            strokeColor = "rgba(0,234,255,0.3)";
          } else if (ns.missed) {
            fill = "rgba(255,0,229,0.2)";
            strokeColor = "rgba(255,0,229,0.4)";
          }

          return (
            <g key={ns.id}>
              <rect
                x={getNoteX(ns.midi) + laneWidth * 0.1}
                y={y}
                width={laneWidth * 0.8}
                height={noteHeight}
                rx={0.6}
                fill={fill}
                stroke={strokeColor}
                strokeWidth={0.15}
                opacity={ns.hit ? 0.3 : 1}
              />
              {/* Note label */}
              {!ns.hit && !ns.missed && (
                <text
                  x={getNoteX(ns.midi) + laneWidth / 2}
                  y={y + noteHeight / 2 + 0.8}
                  textAnchor="middle"
                  fontSize="2"
                  fill="white"
                  opacity={0.7}
                  fontFamily="var(--font-geist-mono)"
                >
                  {midiNoteToName(ns.midi)}
                </text>
              )}
            </g>
          );
        })}

        {/* Lane labels at bottom */}
        {uniqueNotes.map((midi, i) => (
          <text
            key={`label-${midi}`}
            x={i * laneWidth + laneWidth / 2}
            y={98}
            textAnchor="middle"
            fontSize="2"
            fill="rgba(255,255,255,0.2)"
            fontFamily="var(--font-geist-mono)"
          >
            {midiNoteToName(midi)}
          </text>
        ))}
      </svg>

      {/* Hit effects overlay */}
      <AnimatePresence>
        {hitEffects.map((effect) => (
          <motion.div
            key={effect.id}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              top: `${HIT_ZONE_Y}%`,
              left: `${getNoteX(effect.note) + laneWidth / 2}%`,
            }}
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className={`text-sm font-bold ${
                effect.type === "hit" ? "text-cyan text-glow-cyan" : "text-magenta text-glow-magenta"
              }`}
            >
              {effect.type === "hit" ? "✓" : "✗"}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Score HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="glass rounded-xl px-4 py-2">
          <p className="text-xs text-white/40">Pontuação</p>
          <p className="text-xl font-bold text-cyan tabular-nums">{score.toLocaleString()}</p>
        </div>
        <div className="glass rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-white/40">Combo</p>
          <p className={`text-xl font-bold tabular-nums ${combo >= 10 ? "text-cyan text-glow-cyan" : combo > 0 ? "text-white" : "text-white/30"}`}>
            {combo}x
          </p>
        </div>
        <div className="glass rounded-xl px-4 py-2 text-right">
          <p className="text-xs text-white/40">Precisão</p>
          <p className="text-xl font-bold text-white tabular-nums">
            {hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100}%
          </p>
        </div>
      </div>
    </div>
  );
}
