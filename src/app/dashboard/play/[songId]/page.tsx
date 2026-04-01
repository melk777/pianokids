"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ScoreScreen from "@/components/ScoreScreen";
import MidiSetup from "@/components/MidiSetup";
import PianoPlayer from "@/components/PianoPlayer";
import Piano from "@/components/Piano";
import { useMIDI } from "@/hooks/useMIDI";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { getSongById, type Song } from "@/lib/songs";
import {
  type Difficulty,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  filterNotesByDifficulty,
  getAccompanimentNotes,
} from "@/lib/songFilters";
import { Zap, Shield, Crown, Volume2 } from "lucide-react";

const DIFFICULTY_ICONS: Record<Difficulty, React.ReactNode> = {
  beginner: <Shield className="w-4 h-4" />,
  medium: <Zap className="w-4 h-4" />,
  pro: <Crown className="w-4 h-4" />,
};

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params.songId as string;
  const isFreePlay = songId === "freeplay";
  
  const song: Song | undefined = isFreePlay 
      ? { id: "freeplay", title: "Prática Livre", artist: "Sintetizador Livre", category: "Extra" as "Para Iniciantes", isPremium: false, difficulty: "Fácil", duration: 0, bpm: 120, coverUrl: "", notes: [] }
      : getSongById(songId);

  const { isConnected, activeNotes, connect, error } = useMIDI();
  const audio = useAudioEngine();

  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">("idle");
  const [showSetup, setShowSetup] = useState(true);
  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100 });
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Accompaniment scheduler
  const accompanimentScheduled = useRef(false);
  const audioStartTimeRef = useRef<number>(0);

  const handleScoreUpdate = useCallback((score: number, combo: number, accuracy: number) => {
    setFinalScore({ score, combo, accuracy });
  }, []);

  const handleSongEnd = useCallback(() => {
    setIsPlaying(false);
    setGameState("ended");
  }, []);

  // Audio callbacks from game engine
  const handleNoteHit = useCallback(
    (midi: number, duration: number, velocity: number) => {
      if (!audioEnabled) return;
      audio.playStudent(midi, duration, velocity);
      audio.rewardHit();
    },
    [audio, audioEnabled]
  );

  const handleNoteMiss = useCallback(() => {
    if (!audioEnabled) return;
    audio.penaltyMiss();
  }, [audio, audioEnabled]);

  // Compute filtered notes
  const filteredNotes = song
    ? filterNotesByDifficulty(song.notes, difficulty)
    : [];

  // Start game
  const startGame = async () => {
    if (!song) return;

    // ALWAYS init audio context (needed for clock sync even if sound is off)
    // This must happen inside a user gesture handler (click) — Chrome/Safari policy
    await audio.init();

    setIsPlaying(true);
    setGameState("playing");

    // Schedule accompaniment notes via Web Audio absolute scheduling
    const LEAD_IN = 2.0; // 2 seconds lead-in before song starts
    const startAt = audio.getCurrentTime() + LEAD_IN;
    audioStartTimeRef.current = startAt;

    if (audioEnabled) {
      accompanimentScheduled.current = true;
      const accNotes = getAccompanimentNotes(song.notes, difficulty);

      accNotes.forEach((note) => {
        audio.scheduleAccompaniment(
          note.midi,
          startAt + note.time,
          note.duration,
          note.velocity ?? 0.5
        );
      });
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState("idle");
    setFinalScore({ score: 0, combo: 0, accuracy: 100 });
    accompanimentScheduled.current = false;
    audio.destroy(); // destroy and recreate context to instantly stop any scheduled sounds
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audio.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!song) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Header />
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
      <Header />

      <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
        {/* ── Header ── */}
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
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{song.title}</h1>
            <p className="text-sm text-white/40">
              {song.artist} · {filteredNotes.length} notas · {song.bpm} BPM
            </p>
          </div>

          {/* Right indicators */}
          <div className="flex items-center gap-4">
            {/* Audio toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                audioEnabled
                  ? "text-cyan bg-cyan/10 border border-cyan/20"
                  : "text-white/30 bg-white/5 border border-white/10"
              }`}
            >
              <Volume2 className="w-3 h-3" />
              {audioEnabled ? "Som ON" : "Som OFF"}
            </button>

            {/* MIDI indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyan" : "bg-white/20"}`} />
              <span className="text-xs text-white/40">
                {isConnected ? "MIDI Conectado" : "Sem MIDI"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Game Area ── */}
        <AnimatePresence mode="wait">
          {/* ─── IDLE STATE ─── */}
          {gameState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-12 text-center border border-white/[0.06]"
            >
              <div className="max-w-lg mx-auto">
                {/* Play icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan/20 to-cyan/5 flex items-center justify-center mx-auto mb-8">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00EAFF" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21" />
                  </svg>
                </div>

                {/* ── Difficulty Selector ── */}
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">
                    {isFreePlay ? "Modo de Teclado" : "Selecione a Dificuldade"}
                  </p>
                  
                  {!isFreePlay && (
                    <div className="inline-flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 gap-1">
                      {(["beginner", "medium", "pro"] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            difficulty === d
                              ? `${DIFFICULTY_COLORS[d]} bg-white/[0.06] shadow-lg`
                              : "text-white/35 hover:text-white/60"
                          }`}
                        >
                          {difficulty === d && (
                            <motion.div
                              layoutId="difficulty-bg"
                              className={`absolute inset-0 rounded-lg border ${
                                d === "pro"
                                  ? "border-magenta/30 bg-magenta/5"
                                  : d === "medium"
                                  ? "border-cyan/30 bg-cyan/5"
                                  : "border-emerald-400/30 bg-emerald-400/5"
                              }`}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-2">
                            {DIFFICULTY_ICONS[d]}
                            {DIFFICULTY_LABELS[d]}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Note count preview */}
                  {!isFreePlay && (
                    <p className="mt-3 text-xs text-white/25">
                      {filteredNotes.length} notas neste nível
                      {difficulty === "beginner" && " · apenas mão direita"}
                      {difficulty === "pro" && " · janela de tempo reduzida"}
                    </p>
                  )}
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
                      onClick={() => setShowSetup(true)}
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

          {/* ─── PLAYING STATE ─── */}
          {gameState === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <PianoPlayer
                notes={filteredNotes}
                difficulty={difficulty}
                activeNotes={activeNotes}
                isPlaying={isPlaying}
                getAudioTime={() => audio.getCurrentTime() - audioStartTimeRef.current}
                onScoreUpdate={handleScoreUpdate}
                onSongEnd={handleSongEnd}
                onNoteHit={handleNoteHit}
                onNoteMiss={handleNoteMiss}
                isFreePlay={isFreePlay}
              />

              {/* Piano at bottom */}
              <div className="mt-6">
                <Piano activeNotes={activeNotes} startNote={48} endNote={76} />
              </div>

              {/* Stop button */}
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

          {/* ─── ENDED STATE ─── */}
          {gameState === "ended" && (
            <ScoreScreen
              accuracy={finalScore.accuracy}
              score={finalScore.score}
              combo={finalScore.combo}
              onRestart={resetGame}
              onNext={() => router.push("/dashboard/songs")}
              onExit={() => router.push("/dashboard/songs")}
            />
          )}
        </AnimatePresence>
        
        {/* Modal Interceptador */}
        <MidiSetup
           isOpen={showSetup}
           onClose={() => setShowSetup(false)}
           isConnected={isConnected}
           onConnect={connect}
        />
      </div>
    </main>
  );
}
