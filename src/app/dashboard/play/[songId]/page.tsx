"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ScoreScreen from "@/components/ScoreScreen";
import MidiSetup from "@/components/MidiSetup";
import PianoPlayer from "@/components/PianoPlayer";
import OrientationOverlay from "@/components/OrientationOverlay";
import { useMIDI, type MIDINote } from "@/hooks/useMIDI";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
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
  
  const song = useMemo<Song | undefined>(() => {
    if (isFreePlay) {
      return { 
        id: "freeplay", 
        title: "Prática Livre", 
        artist: "Sintetizador Livre", 
        category: "Para Iniciantes", 
        isPremium: false, 
        difficulty: "Fácil", 
        duration: 0, 
        bpm: 120, 
        coverUrl: "", 
        notes: [] 
      };
    }
    return getSongById(songId);
  }, [isFreePlay, songId]);

  const { isConnected, activeNotes: midiActiveNotes, connect } = useMIDI();
  const audio = useAudioEngine();

  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">("idle");
  const [showSetup, setShowSetup] = useState(true);
  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100 });
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Simulated Notes (QWERTY / Virtual Keyboard)
  const [simulatedActiveNotes, setSimulatedActiveNotes] = useState<Map<number, MIDINote>>(new Map());

  const handleSimulatedPlay = useCallback((midi: number) => {
    const noteData: MIDINote = {
      note: midi,
      velocity: 100,
      channel: 1,
      timestamp: performance.now()
    };
    
    setSimulatedActiveNotes(prev => {
      const next = new Map(prev);
      next.set(midi, noteData);
      return next;
    });

    if (audioEnabled) {
      audio.playStudent(midi, 0.5, 0.8);
    }
  }, [audio, audioEnabled]);

  const handleSimulatedRelease = useCallback((midi: number) => {
    setSimulatedActiveNotes(prev => {
      const next = new Map(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  // Keyboard Hook listening to computer keys
  useKeyboardInput({
    onPlayNote: handleSimulatedPlay,
    onReleaseNote: handleSimulatedRelease,
    disabled: gameState !== "playing"
  });

  // Unified Notes Map (Single Source of Truth for game engine)
  const mergedActiveNotes = useMemo(() => {
    const merged = new Map<number, MIDINote>();
    midiActiveNotes.forEach((v, k) => merged.set(k, v));
    simulatedActiveNotes.forEach((v, k) => merged.set(k, v));
    return merged;
  }, [midiActiveNotes, simulatedActiveNotes]);

  // Accompaniment scheduler
  const accompanimentScheduled = useRef(false);
  const audioStartTimeRef = useRef<number>(0);

  // MEMOIZED TIMER: Crucial to prevent game loop restart on every render
  const getAudioTime = useCallback(() => {
    return audio.getCurrentTime() - audioStartTimeRef.current;
  }, [audio]);

  const handleScoreUpdate = useCallback((score: number, combo: number, accuracy: number) => {
    setFinalScore({ score, combo, accuracy });
  }, []);

  const handleSongEnd = useCallback(() => {
    setIsPlaying(false);
    setGameState("ended");
  }, []);

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

  const filteredNotes = useMemo(() => {
    if (!song) return [];
    return filterNotesByDifficulty(song.notes, difficulty);
  }, [song, difficulty]);

  const accompanimentNotes = useMemo(() => {
    if (!song) return [];
    return getAccompanimentNotes(song.notes, difficulty);
  }, [song, difficulty]);

  const startGame = async () => {
    if (!song) return;
    await audio.init();

    // 1. Set timing FIRST
    const LEAD_IN = 2.0;
    const startAt = audio.getCurrentTime() + LEAD_IN;
    audioStartTimeRef.current = startAt;

    // 2. Start game state
    setIsPlaying(true);
    setGameState("playing");

    if (audioEnabled) {
      accompanimentScheduled.current = true;
      accompanimentNotes.forEach((note) => {
        audio.scheduleAccompaniment(note.midi, startAt + note.time, note.duration, note.velocity ?? 0.5);
      });
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState("idle");
    setFinalScore({ score: 0, combo: 0, accuracy: 100 });
    accompanimentScheduled.current = false;
    audio.destroy();
  };

  useEffect(() => {
    return () => { audio.destroy(); };
  }, [audio]);

  if (!song) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Música não encontrada</h1>
          <Link href="/dashboard/songs" className="btn-secondary">Voltar</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      <Header />
      <OrientationOverlay />
      
      <div className="pt-20 md:pt-24 pb-8 md:pb-12 px-4 md:px-6 max-w-5xl mx-auto">
        {/* ── Header ── */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dashboard/songs" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{song.title}</h1>
            <p className="text-sm text-white/40">{song.artist} · {filteredNotes.length} notas</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${audioEnabled ? "text-cyan bg-cyan/10 border border-cyan/20" : "text-white/30 bg-white/5 border border-white/10"}`}>
              <Volume2 className="w-3 h-3" /> {audioEnabled ? "Som ON" : "Som OFF"}
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyan" : "bg-white/20"}`} />
              <span className="text-xs text-white/40">{isConnected ? "MIDI Conectado" : "Sem MIDI"}</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {gameState === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass rounded-2xl p-12 text-center border border-white/[0.06]">
              <div className="max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan/20 to-cyan/5 flex items-center justify-center mx-auto mb-8">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00EAFF" strokeWidth="1.5"><polygon points="5 3 19 12 5 21" /></svg>
                </div>
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-widest text-white/30 mb-4">{isFreePlay ? "Modo de Teclado" : "Selecione a Dificuldade"}</p>
                  {!isFreePlay && (
                    <div className="inline-flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 gap-1">
                      {(["beginner", "medium", "pro"] as Difficulty[]).map((d) => (
                        <button key={d} onClick={() => setDifficulty(d)} className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${difficulty === d ? `${DIFFICULTY_COLORS[d]} bg-white/[0.06] shadow-lg` : "text-white/35 hover:text-white/60"}`}>
                          {difficulty === d && <motion.div layoutId="difficulty-bg" className={`absolute inset-0 rounded-lg border ${d === "pro" ? "border-magenta/30 bg-magenta/5" : d === "medium" ? "border-cyan/30 bg-cyan/5" : "border-emerald-400/30 bg-emerald-400/5"}`} />}
                          <span className="relative z-10 flex items-center gap-2">{DIFFICULTY_ICONS[d]}{DIFFICULTY_LABELS[d]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-3">Pronto para tocar?</h2>
                <p className="text-sm text-white/40 mb-8">Sincronize seu teclado MIDI, use o teclado (A-K) ou clique nas teclas para marcar pontos!</p>
                <div className="flex gap-3 justify-center">
                  {!isConnected && <button onClick={() => setShowSetup(true)} className="btn-secondary">Conectar MIDI</button>}
                  <button onClick={startGame} className="btn-primary">Começar</button>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-8">
              <PianoPlayer
                notes={filteredNotes}
                difficulty={difficulty}
                activeNotes={mergedActiveNotes}
                isPlaying={isPlaying}
                isFreePlay={isFreePlay}
                getAudioTime={getAudioTime}
                onScoreUpdate={handleScoreUpdate}
                onSongEnd={handleSongEnd}
                onNoteHit={handleNoteHit}
                onNoteMiss={handleNoteMiss}
                onPlayNote={handleSimulatedPlay}
                onReleaseNote={handleSimulatedRelease}
                startNote={48}
                endNote={72}
              />
              <div className="flex justify-center">
                <button onClick={resetGame} className="btn-secondary text-sm">Parar Partida</button>
              </div>
            </motion.div>
          )}

          {gameState === "ended" && (
            <ScoreScreen accuracy={finalScore.accuracy} score={finalScore.score} combo={finalScore.combo} onRestart={resetGame} onNext={() => router.push("/dashboard/songs")} onExit={() => router.push("/dashboard/songs")} />
          )}
        </AnimatePresence>
        
        <MidiSetup isOpen={showSetup} onClose={() => setShowSetup(false)} isConnected={isConnected} onConnect={connect} />
      </div>
    </main>
  );
}
