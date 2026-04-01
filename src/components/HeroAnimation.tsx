"use client";

import { motion } from "framer-motion";

const keys = [
  { note: "C", x: 0, white: true },
  { note: "C#", x: 32, white: false },
  { note: "D", x: 44, white: true },
  { note: "D#", x: 76, white: false },
  { note: "E", x: 88, white: true },
  { note: "F", x: 132, white: true },
  { note: "F#", x: 164, white: false },
  { note: "G", x: 176, white: true },
  { note: "G#", x: 208, white: false },
  { note: "A", x: 220, white: true },
  { note: "A#", x: 252, white: false },
  { note: "B", x: 264, white: true },
  { note: "C5", x: 308, white: true },
];

export default function HeroAnimation() {
  return (
    <div className="relative w-full max-w-md mx-auto h-48 md:h-56">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,234,255,0.08) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Piano keys SVG */}
      <svg
        viewBox="0 0 352 140"
        className="w-full h-full relative z-10"
        style={{ filter: "drop-shadow(0 0 30px rgba(0,234,255,0.15))" }}
      >
        {/* White keys */}
        {keys
          .filter((k) => k.white)
          .map((key, i) => (
            <motion.rect
              key={key.note}
              x={key.x}
              y={10}
              width={40}
              height={120}
              rx={4}
              fill="#111"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
              initial={{ y: 10 }}
              animate={{
                y: [10, 6, 10],
                fill: i % 3 === 0 ? ["#111", "#0a1a1f", "#111"] : "#111",
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Black keys */}
        {keys
          .filter((k) => !k.white)
          .map((key, i) => (
            <motion.rect
              key={key.note}
              x={key.x}
              y={10}
              width={24}
              height={76}
              rx={3}
              fill="#000"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={0.5}
              initial={{ y: 10 }}
              animate={{
                y: [10, 7, 10],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.4 + 0.15,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Active note glow effect */}
        <motion.rect
          x={0}
          y={10}
          width={40}
          height={120}
          rx={4}
          fill="transparent"
          stroke="#00EAFF"
          strokeWidth={1.5}
          animate={{
            x: [0, 88, 176, 264, 176, 88, 0],
            opacity: [0.6, 0.8, 0.6, 0.8, 0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            filter: "drop-shadow(0 0 8px rgba(0,234,255,0.4))",
          }}
        />
      </svg>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan/40"
          style={{
            left: `${15 + i * 14}%`,
            top: "20%",
          }}
          animate={{
            y: [-20, -60, -20],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
