"use client";

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from "react";
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
import { Volume2, Mic, MicOff, Play, BookOpen, Settings, RotateCcw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";



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

  const isMicActive = useAudioInput().isListening;
  const activeAudioNote = useAudioInput().activeAudioNote;
  const startMic = useAudioInput().start;
  const stopMic = useAudioInput().stop;
  const audio = useAudioEngine();

  // Tipo para nota MIDI (copiado de useMIDI para manter compatibilidade no código local)
  type PianoNoteRecord = {
    note: number;
    velocity: number;
    channel: number;
    timestamp: number;
  };

  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "countdown" | "playing" | "ended">("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioStartTime, setAudioStartTime] = useState(0);
  // MIDI Setup removido
  useEffect(() => {
    // Tenta iniciar o microfone automaticamente se possível
    // startMic();
  }, [startMic]);
  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isWaitingMode, setIsWaitingMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.08);
  const settingsRef = useRef<HTMLDivElement>(null);

    // Removido handleSimulatedPlay and handleSimulatedRelease as they are unused now due to QWERTY disable

  // UseKeyboardInput hook para tocar notas  // 2. Conexão com o QWERTY Listener (Hook)
  useKeyboardInput();

  const activeNotes = useMemo(() => {
    const merged = new Map<number, PianoNoteRecord>();
    // midiActiveNotes.forEach((v, k) => merged.set(k, v)); // REMOVIDO
    
    // Suporte a Audio Feedback do Microfone
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
    audio.resume();
  }, [audio]);

  const restartGame = useCallback(() => {
    setIsPlaying(false);
    setGameState("idle");
    setFinalScore({ score: 0, combo: 0, accuracy: 100 });
    setShowSettings(false);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSettings]);

  // Lógica da Contagem Regressiva
  useEffect(() => {
    if (gameState !== "countdown" || countdown === null) return;

    // Tocar o TICK rítmico
    audio.playTick(0.15);

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Começar o Jogo pra valer
      const LEAD_TIME = 4; // Segundos para a nota cair do topo (VIEWPORT_SECONDS)
      const startTime = audio.getCurrentTime() + LEAD_TIME;
      setAudioStartTime(startTime);
      
      // Agendar Acompanhamento (Real Music Sync)
      // DESATIVADO: Agora usamos o PianoPlayer para disparar notas em tempo real.
      // Isso permite mudar a velocidade durante a música e ter o Modo Espera funcionando.
      
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

  // AUTO-START Logic from URL Params (Image_2 Flow)
  useEffect(() => {
    const lHand = searchParams.get("leftHand") === "true";
    const rHand = searchParams.get("rightHand") === "true";
    const mic = searchParams.get("mic") === "true";
    
    // Se temos parâmetros de configuração, iniciamos direto
    if (lHand || rHand) {
      const isBoth = lHand && rHand;
      // Mapeamento de níveis baseado nas mãos
      setDifficulty(isBoth ? "pro" : "medium");

      if (mic) startMic();
      
      // Removemos o timer de auto-start para esperar o toque real do aluno
    }
  }, [searchParams, startMic]);

  // ESCUTAR TOQUE PARA INICIAR (Aperte uma tecla para começar)
  // Suporte para Piano (MIDI/Mic), Teclado (Keydown) e Touch (Click)
  useEffect(() => {
    if (gameState !== "idle") return;

    // 1. Piano ou MIDI ja estao no activeNotes
    if (activeNotes.size > 0) {
      startGame();
      return;
    }

    // 2. Teclado do Computador
    const handleKeyDown = () => {
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

    // Se temos a versão específica de 1 mão e o usuário escolheu apenas uma, usamos ela
    if (!isBoth && song.notes1Hand) {
      return song.notes1Hand;
    }

    // Se temos a versão de 2 mãos e o usuário escolheu ambas, usamos ela
    if (isBoth && song.notes2Hands) {
      return song.notes2Hands;
    }

    // Fallback para o comportamento antigo de filtro
    return filterNotesByDifficulty(song.notes, difficulty);
  }, [song, difficulty, searchParams]);

  const accompanimentNotes = useMemo<SongNote[]>(() => {
    if (!song) return [];
    
    const lHand = searchParams.get("leftHand") === "true";
    const rHand = searchParams.get("rightHand") === "true";
    const isBoth = lHand && rHand;

    // Se o usuário está na versão de 1 mão (MIDI 1), 
    // o acompanhamento deve vir desse mesmo contexto ou ser filtrado dele
    if (!isBoth && song.notes1Hand) {
      return getAccompanimentNotes(song.notes1Hand, difficulty);
    }

    // Se está em 2 mãos, usa a versão completa
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

  // ── Bloqueio de Segurança: Apenas PRO pode tocar músicas Premium ──
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
      
      {/* ── HEADER DE JOGO ── */}
      <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/10 glass z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/songs" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-bold leading-none">{song.title}</h1>
            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
              PianoKids Studio • {song.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Volume */}
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg transition-colors ${audioEnabled ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'bg-white/5 text-white/30 border border-white/10'}`}
            title="Volume"
          >
            <Volume2 size={18} />
          </button>
          
          {/* Microfone */}
          <button 
            onClick={() => isMicActive ? stopMic() : startMic()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${isMicActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}
            title="Microfone"
          >
            {isMicActive ? <Mic size={15} /> : <MicOff size={15} />}
            <span className="text-[9px] font-bold uppercase tracking-widest hidden md:inline">{isMicActive ? "MIC" : "MIC"}</span>
          </button>
          
          <div className="h-7 w-px bg-white/10" />
          
          {/* Resolução */}
          <div className="flex items-center gap-1.5">
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Resolução</p>
              <p className="text-[11px] font-black text-white">Full HD</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
          
          <div className="h-7 w-px bg-white/10" />

          {/* Voltar à Biblioteca */}
          <Link
            href="/dashboard/songs"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Voltar à Biblioteca"
          >
            <BookOpen size={18} />
          </Link>

          {/* Configurações Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg border transition-all ${
                showSettings
                  ? 'bg-cyan/15 text-cyan border-cyan/30'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Configurações"
            >
              <Settings size={18} />
            </button>

            {/* ── DROPDOWN DE CONFIGURAÇÕES (Glassmorphism) ── */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/15 shadow-2xl z-50 overflow-hidden"
                  style={{ background: 'rgba(10, 10, 15, 0.80)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                >
                  <div className="p-4 border-b border-white/10">
                    <p className="text-xs font-black uppercase tracking-[3px] text-white/60">Configurações</p>
                  </div>

                  <div className="p-3 flex flex-col gap-3">
                    {/* Velocidade */}
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Velocidade</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPlaybackSpeed(Math.max(0.1, playbackSpeed - 0.1))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-bold text-sm"
                        >−</button>
                        <span className="min-w-[48px] text-center text-sm font-black text-cyan">
                          {Math.round(playbackSpeed * 100)}%
                        </span>
                        <button
                          onClick={() => setPlaybackSpeed(Math.min(1.1, playbackSpeed + 0.1))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-bold text-sm"
                        >+</button>
                      </div>
                    </div>

                    {/* Modo Espera */}
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Modo Espera</p>
                      <button
                        onClick={() => setIsWaitingMode(!isWaitingMode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider transition-all ${
                          isWaitingMode
                            ? 'bg-cyan/20 text-cyan border-cyan/40'
                            : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                        }`}
                      >
                        <Play size={12} className={isWaitingMode ? "fill-cyan" : ""} />
                        {isWaitingMode ? "ON" : "OFF"}
                      </button>
                    </div>

                    {/* Volume do Metrônomo */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Metrônomo</p>
                        <span className="text-[11px] font-black text-white/60">{Math.round(metronomeVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={metronomeVolume}
                        onChange={(e) => setMetronomeVolume(parseFloat(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #00EAFF ${(metronomeVolume / 0.5) * 100}%, rgba(255,255,255,0.1) ${(metronomeVolume / 0.5) * 100}%)`,
                        }}
                      />
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Reiniciar Música */}
                    <button
                      onClick={restartGame}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all text-white/50"
                    >
                      <RotateCcw size={16} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Reiniciar Música</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col p-4 md:p-6 gap-6 overflow-hidden">
        


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
