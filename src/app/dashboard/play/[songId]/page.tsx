"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ScoreScreen from "@/components/ScoreScreen";
import OrientationOverlay from "@/components/OrientationOverlay";
import PianoPlayer from "@/components/PianoPlayer";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useAudioInput } from "@/hooks/useAudioInput";
import { getSongById, type Song, type SongNote } from "@/lib/songs";

import {
  type Difficulty,
  filterNotesByDifficulty,
  getAccompanimentNotes,
} from "@/lib/songFilters";
import { Volume2, Mic, MicOff, Play, Pause, RotateCcw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useBackgroundMusic } from "@/contexts/AudioContext";



export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin mb-4" />
      <span className="text-xs font-bold tracking-[4px] uppercase opacity-40">Sincronizando...</span>
    </div>}>
      <PlayPageContent />
    </Suspense>
  );
}

function PlayPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
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

  const { isPro, loading: subLoading } = useSubscription();

  // ── Hook de microfone — UMA ÚNICA instância (bug fix: antes eram 4 instâncias separadas)
  const {
    isListening: isMicActive,
    activeAudioNote,
    start: startMic,
    stop: stopMic,
  } = useAudioInput();

  const { pauseBackgroundMusic } = useBackgroundMusic();
  const audio = useAudioEngine();

  // ── Pausar música ambiente ao entrar no jogo, restaurar ao sair ──
  useEffect(() => {
    pauseBackgroundMusic();
    return () => {
      // Não auto-retoma ao sair — o usuário pode querer manter desligada
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type PianoNoteRecord = {
    note: number;
    velocity: number;
    channel: number;
    timestamp: number;
  };

  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "countdown" | "playing" | "ended">("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioStartTime, setAudioStartTime] = useState(0);

  useEffect(() => {
    // placeholder
  }, [startMic]);

  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isWaitingMode, setIsWaitingMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [metronomeVolume, setMetronomeVolume] = useState(0.08);

  useKeyboardInput();

  const activeNotes = useMemo(() => {
    const merged = new Map<number, PianoNoteRecord>();
    
    if (activeAudioNote) {
      merged.set(activeAudioNote.note, {
        note: activeAudioNote.note,
        velocity: 80,
        channel: 1,
        timestamp: performance.now()
      });
    }
    return merged;
  }, [activeAudioNote]);

  const startGame = useCallback(() => {
    setGameState("countdown");
    setCountdown(3);
    setIsPaused(false);
    audio.resume();
  }, [audio]);

  const restartGame = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setGameState("idle");
    setFinalScore({ score: 0, combo: 0, accuracy: 100 });
  }, []);

  // ── ATALHO ESPAÇO: Pausar/Retomar ──
  useEffect(() => {
    const handleSpaceBar = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      
      if (gameState === "playing") {
        setIsPaused(prev => !prev);
        setIsPlaying(prev => !prev);
      } else if (gameState === "idle") {
        startGame();
      }
    };

    window.addEventListener("keydown", handleSpaceBar);
    return () => window.removeEventListener("keydown", handleSpaceBar);
  }, [gameState, startGame]);

  // Lógica da Contagem Regressiva
  useEffect(() => {
    if (gameState !== "countdown" || countdown === null) return;

    audio.playTick(0.15);

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const LEAD_TIME = 4;
      const startTime = audio.getCurrentTime() + LEAD_TIME;
      setAudioStartTime(startTime);
      
      setGameState("playing");
      setIsPlaying(true);
      setCountdown(null);
    }
  }, [countdown, gameState, audio, song, isFreePlay, difficulty]);

  const handleScoreUpdate = useCallback((score: number, combo: number, accuracy: number) => {
    setFinalScore({ score, combo, accuracy });
  }, []);

  const handleSongEnd = useCallback(() => {
    setIsPlaying(false);
    setGameState("ended");
  }, []);

  const handlePlayAccompaniment = useCallback((midi: number, duration: number) => {
    if (audioEnabled) {
      audio.scheduleAccompaniment(midi, audio.getCurrentTime(), duration, 0.6);
    }
  }, [audio, audioEnabled]);

  // AUTO-START Logic from URL Params
  useEffect(() => {
    const lHand = searchParams.get("leftHand") === "true";
    const rHand = searchParams.get("rightHand") === "true";
    const mic = searchParams.get("mic") === "true";
    
    if (lHand || rHand) {
      const isBoth = lHand && rHand;
      setDifficulty(isBoth ? "pro" : "medium");
      if (mic) startMic();
    }
  }, [searchParams, startMic]);

  // ESCUTAR TOQUE PARA INICIAR
  useEffect(() => {
    if (gameState !== "idle") return;

    if (activeNotes.size > 0) {
      startGame();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") return; // Space handled separately
      startGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNotes, gameState, startGame]);

  const filteredNotes = useMemo<SongNote[]>(() => {
    if (!song) return [];
    
    const lHand = searchParams.get("leftHand") === "true";
    const rHand = searchParams.get("rightHand") === "true";
    const isBoth = lHand && rHand;

    if (!isBoth && song.notes1Hand) {
      return song.notes1Hand;
    }

    if (isBoth && song.notes2Hands) {
      return song.notes2Hands;
    }

    return filterNotesByDifficulty(song.notes, difficulty);
  }, [song, difficulty, searchParams]);

  const accompanimentNotes = useMemo<SongNote[]>(() => {
    if (!song) return [];
    
    const lHand = searchParams.get("leftHand") === "true";
    const rHand = searchParams.get("rightHand") === "true";
    const isBoth = lHand && rHand;

    if (!isBoth && song.notes1Hand) {
      return getAccompanimentNotes(song.notes1Hand, difficulty);
    }

    if (isBoth && song.notes2Hands) {
      return getAccompanimentNotes(song.notes2Hands, difficulty);
    }

    return getAccompanimentNotes(song.notes, difficulty);
  }, [song, difficulty, searchParams]);

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Música não encontrada</h1>
        <Link href="/dashboard/songs" className="text-cyan hover:underline">
          Voltar para a biblioteca
        </Link>
      </div>
    );
  }

  // ── Bloqueio de Segurança ──
  if (!subLoading && song.isPremium && !isPro) {
    router.push("/dashboard/songs");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold tracking-widest uppercase text-rose-400">Acesso Restrito</span>
        <p className="text-xs text-white/40 mt-2">Esta música requer uma assinatura PRO. Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans overflow-hidden">
      <OrientationOverlay />
      
      {/* ── HEADER MODERNO TRANSPARENTE ── */}
      <div 
        className="h-12 flex items-center justify-between px-3 md:px-5 z-20 shrink-0 border-b border-white/[0.06]"
        style={{ background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Esquerda: Voltar + Título */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard/songs" className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-bold leading-none">{song.title}</h1>
            <p className="text-[8px] text-white/35 uppercase tracking-widest mt-0.5">
              {song.artist}
            </p>
          </div>
        </div>

        {/* Centro/Direita: Todos os controles inline */}
        <div className="flex items-center gap-1.5 md:gap-2">
          
          {/* Volume */}
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-lg transition-colors ${audioEnabled ? 'text-cyan' : 'text-white/25'}`}
            title="Volume"
          >
            <Volume2 size={16} />
          </button>

          {/* Microfone (CORRIGIDO) */}
          <button 
            onClick={() => isMicActive ? stopMic() : startMic()}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[9px] font-bold uppercase tracking-wider ${
              isMicActive 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                : 'text-white/30 border border-transparent hover:text-white/50'
            }`}
            title="Microfone"
          >
            {isMicActive ? <Mic size={13} /> : <MicOff size={13} />}
            <span className="hidden md:inline">{isMicActive ? "MIC ON" : "MIC OFF"}</span>
          </button>
          
          <div className="h-5 w-px bg-white/10" />

          {/* Resolução */}
          <div className="flex items-center gap-1">
            <div className="text-right">
              <p className="text-[8px] text-white/25 uppercase tracking-widest font-bold leading-none">Resolução</p>
              <p className="text-[10px] font-black text-white leading-none mt-0.5">Full HD</p>
            </div>
            <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="h-5 w-px bg-white/10" />

          {/* Velocidade: [-] 100% [+] */}
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-white/25 font-bold uppercase tracking-wider hidden md:inline">Vel</span>
            <button 
              onClick={() => setPlaybackSpeed(Math.max(0.15, playbackSpeed - 0.05))}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/8 hover:bg-white/15 transition-colors text-white/60 text-xs font-bold"
            >−</button>
            <span className="min-w-[36px] text-center text-[10px] font-black text-cyan">
              {Math.round(playbackSpeed * 100)}%
            </span>
            <button 
              onClick={() => setPlaybackSpeed(Math.min(1.1, playbackSpeed + 0.05))}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/8 hover:bg-white/15 transition-colors text-white/60 text-xs font-bold"
            >+</button>
          </div>

          <div className="h-5 w-px bg-white/10" />

          {/* Modo Espera */}
          <button 
            onClick={() => setIsWaitingMode(!isWaitingMode)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[9px] font-black uppercase tracking-wider ${
              isWaitingMode 
                ? 'bg-cyan/15 text-cyan border border-cyan/30' 
                : 'text-white/30 border border-transparent hover:text-white/50'
            }`}
          >
            <Play size={11} className={isWaitingMode ? "fill-cyan" : ""} />
            <span className="hidden md:inline">Espera</span>
            <span className={`text-[9px] font-black ${isWaitingMode ? 'text-cyan' : 'text-white/40'}`}>
              {isWaitingMode ? "ON" : "OFF"}
            </span>
          </button>

          <div className="h-5 w-px bg-white/10" />

          {/* Metrônomo: [-] 8% [+] */}
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-white/25 font-bold uppercase tracking-wider hidden md:inline">Met</span>
            <button 
              onClick={() => setMetronomeVolume(Math.max(0, metronomeVolume - 0.02))}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/8 hover:bg-white/15 transition-colors text-white/60 text-xs font-bold"
            >−</button>
            <span className="min-w-[30px] text-center text-[10px] font-black text-white/60">
              {Math.round(metronomeVolume * 100)}%
            </span>
            <button 
              onClick={() => setMetronomeVolume(Math.min(0.5, metronomeVolume + 0.02))}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/8 hover:bg-white/15 transition-colors text-white/60 text-xs font-bold"
            >+</button>
          </div>

          <div className="h-5 w-px bg-white/10" />

          {/* Reiniciar Música */}
          <button
            onClick={restartGame}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Reiniciar Música"
          >
            <RotateCcw size={13} />
            <span className="text-[9px] font-bold uppercase tracking-wider hidden lg:inline">Reiniciar</span>
          </button>

          {/* Indicador de Pausa */}
          {isPaused && gameState === "playing" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Pause size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">Pausado</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        

        <AnimatePresence mode="wait">
          {gameState === "idle" && (
            <motion.div 
              key="idle" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex flex-col items-center justify-center p-12 text-center h-full cursor-pointer select-none"
              onClick={startGame}
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse blur-xl" />
                  <Play size={40} className="text-white absolute" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-[8px] uppercase">
                  Aperte uma tecla para começar
                </h2>
                <p className="text-cyan/60 text-xs font-bold tracking-[4px] uppercase">O Estúdio está pronto e te esperando</p>
              </motion.div>
            </motion.div>
          )}

          {gameState === "countdown" && (
            <motion.div 
              key="countdown"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="flex flex-col items-center justify-center p-12 text-center h-full"
            >
              <motion.div
                key={countdown}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="flex flex-col items-center"
              >
                <span className="text-8xl md:text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                   {countdown === 0 ? "VAI!" : countdown}
                </span>
                <p className="text-cyan text-xs font-bold tracking-[10px] uppercase mt-8 animate-pulse">Prepare-se</p>
              </motion.div>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              <PianoPlayer
                notes={filteredNotes}
                difficulty={difficulty}
                activeNotes={activeNotes}
                isPlaying={isPlaying}
                songDuration={song.duration}
                getAudioTime={() => audio.getCurrentTime() - audioStartTime}
                metronomeVolume={metronomeVolume}
                onScoreUpdate={handleScoreUpdate}
                onSongEnd={handleSongEnd}
                onPlayTick={(v) => audio.playTick(v || metronomeVolume)}
                isWaitingMode={isWaitingMode}
                onPlayAccompaniment={handlePlayAccompaniment}
                accompanimentNotes={accompanimentNotes}
                playbackSpeed={playbackSpeed}
                startNote={36}
                endNote={84}
              />
            </motion.div>
          )}

          {gameState === "ended" && (
            <ScoreScreen 
              score={finalScore.score} 
              combo={finalScore.combo} 
              accuracy={finalScore.accuracy} 
              onRestart={() => {
                setGameState("idle");
              }}
              onNext={() => {
                router.push("/dashboard/songs");
              }}
              onExit={() => {
                router.push("/dashboard/songs");
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
