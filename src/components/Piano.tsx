"use client";

import { motion } from "framer-motion";
import { isBlackKey, midiNoteToName } from "@/hooks/useMIDI";

interface PianoProps {
  startNote?: number; // Default: 48 (C3)
  endNote?: number;   // Default: 72 (C5)
  activeNotes: Map<number, { note: number; velocity: number }>;
  correctNotes?: Set<number>;
  wrongNotes?: Set<number>;
}

export default function Piano({
  startNote = 48,
  endNote = 72,
  activeNotes,
  correctNotes = new Set(),
  wrongNotes = new Set(),
}: PianoProps) {
  // Generate note range
  const notes: number[] = [];
  for (let i = startNote; i <= endNote; i++) {
    notes.push(i);
  }

  const whiteNotes = notes.filter((n) => !isBlackKey(n));
  const blackNotes = notes.filter((n) => isBlackKey(n));

  const whiteKeyWidth = 100 / whiteNotes.length;

  // Calculate white key index for a given note
  const getWhiteKeyIndex = (note: number): number => {
    return whiteNotes.indexOf(note);
  };

  // Get x position for a black key (between the two adjacent white keys)
  const getBlackKeyX = (note: number): number => {
    const prevWhite = note - 1;
    const idx = getWhiteKeyIndex(prevWhite);
    return (idx + 1) * whiteKeyWidth - whiteKeyWidth * 0.15;
  };

  const getKeyColor = (note: number): string => {
    if (wrongNotes.has(note)) return "#FF00E5";
    if (correctNotes.has(note)) return "#00EAFF";
    if (activeNotes.has(note)) return "#00EAFF";
    return isBlackKey(note) ? "#000" : "#111";
  };

  const getGlow = (note: number): string => {
    if (activeNotes.has(note) || correctNotes.has(note)) {
      return "drop-shadow(0 0 8px rgba(0,234,255,0.5))";
    }
    if (wrongNotes.has(note)) {
      return "drop-shadow(0 0 8px rgba(255,0,229,0.5))";
    }
    return "none";
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <svg viewBox={`0 0 100 28`} className="w-full" style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))" }}>
        {/* White keys */}
        {whiteNotes.map((note, i) => (
          <motion.rect
            key={note}
            x={i * whiteKeyWidth}
            y={0}
            width={whiteKeyWidth - 0.3}
            height={26}
            rx={0.5}
            fill={getKeyColor(note)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.15}
            animate={{
              fill: getKeyColor(note),
              filter: getGlow(note),
            }}
            transition={{ duration: 0.1 }}
          />
        ))}

        {/* Black keys */}
        {blackNotes.map((note) => (
          <motion.rect
            key={note}
            x={getBlackKeyX(note)}
            y={0}
            width={whiteKeyWidth * 0.55}
            height={16}
            rx={0.4}
            fill={getKeyColor(note)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={0.1}
            animate={{
              fill: getKeyColor(note),
              filter: getGlow(note),
            }}
            transition={{ duration: 0.1 }}
          />
        ))}

        {/* Note labels for white keys */}
        {whiteNotes.map((note, i) => {
          const name = midiNoteToName(note);
          const isActive = activeNotes.has(note);
          return (
            <text
              key={`label-${note}`}
              x={i * whiteKeyWidth + whiteKeyWidth / 2}
              y={24}
              textAnchor="middle"
              fontSize="1.5"
              fill={isActive ? "#00EAFF" : "rgba(255,255,255,0.15)"}
              fontFamily="var(--font-geist-mono)"
            >
              {name.replace(/\d/, "")}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
