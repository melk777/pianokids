"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WaterfallGame from "@/components/WaterfallGame";
import Piano from "@/components/Piano";
import { useMIDI } from "@/hooks/useMIDI";
import { getSongById } from "@/lib/songs";

export default function PlayPage() {
  const params = useParams();
  const songId = params.songId as string;
  const song = getSongById(songId);

  const { isConnected, activeNotes, connect, error } = useMIDI();
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">("idle");
  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100 });

  const handleScoreUpdate = useCallback((score: number, combo: number, accuracy: number) => {
    setFinalScore({ score, combo, accuracy });
  }, []);

  const handleSongEnd = useCallback(() => {
    setIsPlaying(false);
    setGameState("ended");
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setGameState("playing");
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState("idle");
    setFinalScore({ score: 0, combo: 0, accuracy: 100 });
  };

  if (!song) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Música não encontrada</h1>
          <Link href="/dashboard/songs" className="btn-secondary">
            Voltar às músicas
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <Link
              href="/dashboard/songs"
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-3"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{song.title}</h1>
            <p className="text-sm text-white/40">{song.artist} · {song.notes.length} notas · {song.bpm} BPM</p>
          </div>

          {/* Connection indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyan" : "bg-white/20"}`} />
            <span className="text-xs text-white/40">
              {isConnected ? "MIDI Conectado" : "Sem MIDI"}
            </span>
          </div>
        </motion.div>

        {/* Game Area */}
        <AnimatePresence mode="wait">
          {gameState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan/20 to-cyan/5 flex items-center justify-center mx-auto mb-6">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00EAFF" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21"/>
                  </svg>
                </div>

                <h2 className="text-xl font-semibold mb-3">Pronto para tocar?</h2>
                <p className="text-sm text-white/40 mb-8">
                  {isConnected
                    ? "Seu teclado está conectado. Pressione começar e toque as notas quando elas chegarem na linha azul."
                    : "Conecte seu teclado MIDI para validar as notas, ou apenas assista as notas caírem."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!isConnected && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={connect}
                      className="btn-secondary"
                    >
                      Conectar MIDI
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startGame}
                    className="btn-primary"
                  >
                    Começar
                  </motion.button>
                </div>

                {error && <p className="mt-4 text-sm text-magenta/80">{error}</p>}
              </div>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <WaterfallGame
                song={song}
                activeNotes={activeNotes}
                isPlaying={isPlaying}
                onScoreUpdate={handleScoreUpdate}
                onSongEnd={handleSongEnd}
              />

              {/* Piano at bottom */}
              <div className="mt-6">
                <Piano activeNotes={activeNotes} startNote={48} endNote={72} />
              </div>

              {/* Pause button */}
              <div className="flex justify-center mt-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={resetGame}
                  className="btn-secondary text-sm"
                >
                  Parar
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === "ended" && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="mb-8"
              >
                <div className="text-6xl mb-4">
                  {finalScore.accuracy >= 90 ? "🌟" : finalScore.accuracy >= 70 ? "👏" : "💪"}
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {finalScore.accuracy >= 90
                    ? "Incrível!"
                    : finalScore.accuracy >= 70
                    ? "Muito bem!"
                    : "Continue praticando!"}
                </h2>
              </motion.div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-white/40 mb-1">Pontuação</p>
                  <p className="text-2xl font-bold text-cyan">{finalScore.score.toLocaleString()}</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-white/40 mb-1">Combo máx.</p>
                  <p className="text-2xl font-bold text-white">{finalScore.combo}x</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-white/40 mb-1">Precisão</p>
                  <p className="text-2xl font-bold text-white">{Math.round(finalScore.accuracy)}%</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={resetGame}
                  className="btn-primary"
                >
                  Tocar novamente
                </motion.button>
                <Link href="/dashboard/songs" className="btn-secondary">
                  Outras músicas
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
