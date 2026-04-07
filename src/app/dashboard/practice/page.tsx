"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Header from "@/components/Header";
import Piano from "@/components/Piano";
import { useMIDI, midiNoteToName } from "@/hooks/useMIDI";

export default function PracticePage() {
  const { isConnected, activeNotes, connect, devices, lastNote, error } = useMIDI();
  const [showHelp, setShowHelp] = useState(true);

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
        {/* Back + Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Voltar
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Prática <span className="text-magenta">Livre</span>
              </h1>
              <p className="text-white/40 mt-2">
                Toque livremente e veja as notas no piano visual.
              </p>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyan animate-glow-pulse" : "bg-white/20"}`} />
              <span className="text-sm text-white/40">
                {isConnected
                  ? `${devices.length} dispositivo${devices.length !== 1 ? "s" : ""}`
                  : "Desconectado"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* MIDI Connection */}
        {!isConnected && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass rounded-2xl p-8 text-center mb-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
                <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Conecte seu teclado MIDI</h3>
            <p className="text-sm text-white/40 mb-6">
              Conecte um teclado MIDI via USB para começar a tocar.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={connect}
              className="btn-primary"
            >
              Conectar Teclado
            </motion.button>
            {error && (
              <p className="mt-4 text-sm text-magenta/80">{error}</p>
            )}
          </motion.div>
        )}

        {/* Piano Visualization */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Piano activeNotes={activeNotes} />
        </motion.div>

        {/* Active Notes Display */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/50">Notas ativas</h3>
            {lastNote && (
              <span className="text-xs text-white/30">
                Última: {midiNoteToName(lastNote.note)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 min-h-[48px]">
            {activeNotes.size === 0 ? (
              <p className="text-sm text-white/20 italic">
                {isConnected ? "Pressione uma tecla no teclado MIDI..." : "Conecte um teclado para começar"}
              </p>
            ) : (
              Array.from(activeNotes.entries()).map(([note]) => (
                <motion.div
                  key={note}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="px-4 py-2 rounded-lg bg-cyan/10 border border-cyan/20 text-gradient font-black font-mono text-sm"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0,234,255,0.3))" }}
                >
                  {midiNoteToName(note)}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Help tip */}
        {showHelp && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 glass rounded-xl p-4 flex items-start justify-between"
          >
            <div className="flex gap-3">
              <span className="text-cyan/60 mt-0.5">💡</span>
              <div>
                <p className="text-sm text-white/50">
                  <strong className="text-white/70">Dica:</strong> Use as teclas do seu teclado MIDI para ver as notas iluminarem no piano acima. 
                  As notas são destacadas com o <span className="text-gradient font-black">gradiente</span> quando pressionadas.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-white/20 hover:text-white/50 transition-colors ml-4 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
