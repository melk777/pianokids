"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export default function GalaxyBackground() {
  // Gerar estrelas estáticas de forma determinística no lado do cliente
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Estrelas Cintilantes */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full opacity-0"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: star.size > 2 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.8)` : "none",
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Nebulosas Suaves (Gradientes animados) */}
      <motion.div
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20 filter blur-[120px]"
        style={{ background: "radial-gradient(circle, #00EAFF 0%, transparent 70%)" }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-10 filter blur-[100px]"
        style={{ background: "radial-gradient(circle, #FF00E5 0%, transparent 70%)" }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.15, 0.1],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Partículas flutuantes (Poeira Espacial) */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute bg-cyan/20 rounded-full blur-[1px]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, 20, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
}
