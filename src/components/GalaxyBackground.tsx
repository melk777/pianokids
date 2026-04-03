"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export default function GalaxyBackground() {
  // Gerar estrelas com trajetórias diagonais (mais estrelas para densidade épica)
  const stars = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => {
      const directionX = Math.random() > 0.5 ? 30 : -30;
      const directionY = Math.random() > 0.5 ? 30 : -30;
      
      return {
        id: i,
        startX: Math.random() * 100,
        startY: Math.random() * 100,
        endX: directionX,
        endY: directionY,
        size: Math.random() * 1.5 + 0.5,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * -30,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Planeta Saturno-Kids (Mediano e sempre visível) */}
      <motion.div
        className="absolute top-[25%] right-[10%] w-48 h-48 md:w-64 md:h-64 z-0"
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 2, 0]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        {/* O Anel de Saturno */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[40%] rounded-[100%] border-[8px] md:border-[12px] border-cyan/20 rotate-[-25deg] shadow-[0_0_20px_rgba(0,234,255,0.1)]"
          style={{
            boxShadow: "inset 0 0 10px rgba(0,234,255,0.2)",
          }}
        />
        
        {/* O Corpo do Planeta */}
        <div 
          className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_60px_rgba(0,234,255,0.2)]"
          style={{
            background: "radial-gradient(circle at 30% 30%, #00EAFF 0%, #006677 50%, #001122 100%)",
          }}
        >
          {/* Sombras internas para volume */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
          <div className="absolute inset-0 border border-cyan/10 rounded-full" />
        </div>

        {/* TECLADO ESPACIAL (Overlay frontal ao planeta) */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[90%] flex items-end gap-[2px] z-10 px-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={`white-${i}`} className="relative flex-1 h-20 md:h-28 rounded-sm bg-white/5 border border-cyan/30 backdrop-blur-[2px] shadow-[0_0_15px_rgba(0,234,255,0.1)]">
                    {/* Teclas Pretas (Posicionamento entre brancas) */}
                    {[0, 1, 3, 4, 5].includes(i) && (
                        <div className="absolute right-[-40%] top-0 w-[60%] h-[60%] bg-black/80 rounded-sm border border-white/10 z-20" />
                    )}
                </div>
            ))}
            {/* Brilho neon na base do teclado */}
            <div className="absolute inset-0 border-b-2 border-cyan/40 blur-[4px] -z-10" />
        </div>
      </motion.div>


      {/* 300+ Estrelas com Movimento Diagonal Suave */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.startX}%`,
            top: `${star.startY}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            x: [0, star.endX * 5],
            y: [0, star.endY * 5],
            opacity: [0.05, 0.3, 0.05],
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
