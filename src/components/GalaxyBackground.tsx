"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export default function GalaxyBackground() {
  // Gerar estrelas com trajetórias diagonais
  const stars = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => {
      const directionX = Math.random() > 0.5 ? 20 : -20;
      const directionY = Math.random() > 0.5 ? 20 : -20;
      
      return {
        id: i,
        startX: Math.random() * 100,
        startY: Math.random() * 100,
        endX: directionX, // Relativo ao start
        endY: directionY, // Relativo ao start
        size: Math.random() * 2 + 0.5,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * -20, // Inicia em pontos diferentes da animação
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Planeta Mediano e Distante */}
      <motion.div
        className="absolute top-[20%] right-[15%] w-32 h-32 md:w-48 md:h-48 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, #00EAFF 0%, #006677 40%, #001122 80%)",
          boxShadow: "inset -10px -10px 30px rgba(0,0,0,0.8), 0 0 40px rgba(0,234,255,0.15)",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 0.6, 
          scale: 1,
          y: [0, -15, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        {/* Brilho Atmosférico */}
        <div className="absolute inset-0 rounded-full border border-cyan/20 blur-[2px]" />
      </motion.div>

      {/* Estrelas com Movimento Diagonal */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.startX}%`,
            top: `${star.startY}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: 0.3,
          }}
          animate={{
            x: [0, star.endX * 5],
            y: [0, star.endY * 5],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "linear",
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
