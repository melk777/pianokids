"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Activity } from "lucide-react";
import { useAudioInput } from "@/hooks/useAudioInput";

export default function AudioEngine() {
  const { isListening, activeAudioNote, start, stop, error } = useAudioInput();

  return (
    <div className="flex flex-col items-center justify-center p-8 glass rounded-3xl border border-white/10 w-full max-w-sm mx-auto overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-3 rounded-full ${isListening ? 'bg-cyan/20 text-cyan animate-pulse' : 'bg-white/5 text-white/40'}`}>
          {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </div>
        <h3 className="text-xl font-bold text-white">Reconhecimento</h3>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        {/* Anéis de Pulsação de Áudio */}
        <AnimatePresence>
          {isListening && activeAudioNote && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1 + activeAudioNote.volume * 2, opacity: 0.1 }}
                className="absolute inset-0 bg-cyan rounded-full"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1 + activeAudioNote.volume * 4, opacity: 0.05 }}
                className="absolute inset-0 bg-cyan rounded-full"
              />
            </>
          )}
        </AnimatePresence>

        <div className="z-10 text-center">
          <AnimatePresence mode="wait">
            {activeAudioNote ? (
              <motion.div
                key={activeAudioNote.name}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-7xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              >
                {activeAudioNote.name}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                className="text-white flex flex-col items-center gap-2"
              >
                <Activity className="w-12 h-12" />
                <span className="text-xs uppercase tracking-widest">Silêncio</span>
              </motion.div>
            )}
          </AnimatePresence>
          {activeAudioNote && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-cyan text-sm font-mono mt-2"
            >
              {Math.round(activeAudioNote.frequency)} Hz
            </motion.div>
          )}
        </div>
      </div>

      {/* Barra de Clareza/Confiança */}
      {isListening && activeAudioNote && (
        <div className="w-full mb-8">
          <div className="flex justify-between text-[10px] text-white/40 mb-1 uppercase tracking-tighter">
            <span>Clareza do Som</span>
            <span>{Math.round(activeAudioNote.clarity * 100)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${activeAudioNote.clarity * 100}%` }}
              className={`h-full ${activeAudioNote.clarity > 0.85 ? 'bg-cyan' : 'bg-magenta'}`}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-magenta mb-4 text-center">{error}</p>
      )}

      <button
        onClick={isListening ? stop : start}
        className={`w-full py-4 rounded-2xl font-bold transition-all ${
          isListening 
            ? 'bg-magenta/20 text-magenta border border-magenta/20 hover:bg-magenta/30' 
            : 'bg-cyan text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(0,234,255,0.4)]'
        }`}
      >
        {isListening ? "Parar Reconhecimento" : "Iniciar Microfone"}
      </button>

      <p className="mt-6 text-[10px] text-white/30 text-center leading-relaxed">
        Toque uma tecla no seu piano real. O microfone identificará a nota instantaneamente.
      </p>
    </div>
  );
}
