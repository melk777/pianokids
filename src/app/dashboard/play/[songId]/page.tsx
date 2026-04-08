"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ScoreScreen from "@/components/ScoreScreen";
import OrientationOverlay from "@/components/OrientationOverlay";
import PianoPlayer from "@/components/PianoPlayer";
// Removido useMIDI
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useAudioInput } from "@/hooks/useAudioInput";
import { getSongById, type Song, type SongNote } from "@/lib/songs";

import {
  type Difficulty,
  filterNotesByDifficulty,
  getAccompanimentNotes,
} from "@/lib/songFilters";
import { Volume2, Mic, MicOff, Play } from "lucide-react";
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 0.1 a 1.1

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
    audio.resume(); // Destrava o AudioContext cedo
  }, [audio]);

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
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 glass z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/songs" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-none">{song.title}</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
              PianoKids Studio • {song.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg transition-colors ${audioEnabled ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'bg-white/5 text-white/30 border border-white/10'}`}
          >
            <Volume2 size={20} />
          </button>
          
          <button 
            onClick={() => isMicActive ? stopMic() : startMic()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isMicActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            {isMicActive ? <Mic size={16} /> : <MicOff size={16} />}
            <span className="text-[10px] font-bold uppercase tracking-widest">{isMicActive ? "MIC ATIVO" : "MIC OFF"}</span>
          </button>
          
          <div className="h-8 w-px bg-white/10 mx-2" />
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Resolução</p>
              <p className="text-xs font-black text-white">Full HD</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2" />

          {/* VELOCIDADE: [-] 100% [+] */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
             <button 
               onClick={() => setPlaybackSpeed(Math.max(0.1, playbackSpeed - 0.1))}
               className="w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 transition-colors text-white font-bold"
             >
               -
             </button>
             <div className="px-2 min-w-[80px] text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-widest font-black">Velocidade</p>
                <p className="text-xs font-black text-cyan">{Math.round(playbackSpeed * 100)}%</p>
             </div>
             <button 
               onClick={() => setPlaybackSpeed(Math.min(1.1, playbackSpeed + 0.1))}
               className="w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 transition-colors text-white font-bold"
             >
               +
             </button>
          </div>

          <div className="h-8 w-px bg-white/10 mx-2" />

          {/* Toggle Modo Espera */}
          <button 
            onClick={() => setIsWaitingMode(!isWaitingMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isWaitingMode ? 'bg-cyan text-black border-cyan' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
          >
            <Play size={14} className={isWaitingMode ? "fill-black" : ""} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isWaitingMode ? "ESPERA: ON" : "MODO ESPERA"}
            </span>
          </button>
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
                onScoreUpdate={handleScoreUpdate}
                onSongEnd={handleSongEnd}
                onPlayTick={(v) => audio.playTick(v || 0.1)}
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
