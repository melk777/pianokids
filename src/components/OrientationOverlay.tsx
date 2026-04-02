"use client";

import React from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

/**
 * Overlay que aparece apenas em telas pequenas quando a orientação é "portrait".
 * Força o usuário a girar o celular para o modo "landscape".
 */
export default function OrientationOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-white p-8 text-center sm:hidden portrait:flex hidden"
    >
      <div className="w-24 h-24 rounded-full bg-cyan/10 flex items-center justify-center mb-8 border border-cyan/20">
        <motion.div
          animate={{ rotate: 90 }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <RotateCcw className="w-12 h-12 text-cyan" />
        </motion.div>
      </div>
      
      <h2 className="text-2xl font-black mb-4 tracking-tight uppercase">
        Gire seu celular!
      </h2>
      <p className="text-white/40 text-sm max-w-[240px] leading-relaxed font-medium">
        Para uma experiência mágica ao tocar piano, precisamos que você use o celular deitado (modo paisagem).
      </p>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping" />
        <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
          Aguardando Rotação
        </span>
      </div>
    </motion.div>
  );
}
