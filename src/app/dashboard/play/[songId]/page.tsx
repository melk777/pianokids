"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { songs } from "@/lib/songs";
import PianoPlayer from "@/components/PianoPlayer";
import StarryBackground from "@/components/StarryBackground";
import { useSFX } from "@/hooks/useSFX";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  ArrowLeft, 
  Settings, 
  Music,
  Trophy,
  Loader2,
  AlertCircle
} from "lucide-react";
import Header from "@/components/Header";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useAudioInput } from "@/hooks/useAudioInput";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { type MIDINote } from "@/hooks/useMIDI";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import type { Difficulty } from "@/lib/songFilters";

export default function PlaySongPage() {
  const params = useParams();
  const router = useRouter();
  const { playClick } = useSFX();
  const songId = params.songId as string;
  const song = songs.find((s) => s.id === songId);

  // Profile and Progress tracking
  const { recordPracticeSession } = useProfile();
  const { hasAccess: isSubscribed, loading: subscriptionLoading } = useSubscription();

  // Audio Context and Synth
  const audioEngine = useAudioEngine();
  const { isSupported: micSupported, isListening, start: startMic, activeAudioNote } = useAudioInput();

  // Component State
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [difficulty] = useState<Difficulty>("beginner");
  const [audioEnabled] = useState(true);
  const [simulatedActiveNotes, setSimulatedActiveNotes] = useState<Map<number, { note: number; timestamp: number }>>(new Map());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [tempo, setTempo] = useState(1);
  const [isWaitingMode, setIsWaitingMode] = useState(true);

  // Sync mic on mount
  useEffect(() => {
    if (micSupported && !isListening) {
      startMic();
    }
  }, [micSupported, isListening, startMic]);

  // Pre-filtered notes based on difficulty (Songs in current lib don't have note-level difficulty filtering)
  const songNotes = useMemo(() => {
    if (!song) return [];
    return song.notes;
  }, [song]);

  const handleSimulatedPlay = useCallback((midi: number) => {
    setSimulatedActiveNotes((prev) => {
      const next = new Map(prev);
      next.set(midi, { note: midi, timestamp: Date.now() });
      return next;
    });

    if (audioEnabled) {
      audioEngine.playStudent(midi, 0.8);
    }
  }, [audioEngine, audioEnabled]);

  const handleSimulatedRelease = useCallback((midi: number) => {
    setSimulatedActiveNotes((prev) => {
      const next = new Map(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  // UseKeyboardInput hook (QWERTY disabled)
  useKeyboardInput();

  const activeNotes = useMemo(() => {
    const merged = new Map<number, MIDINote>();
    
    simulatedActiveNotes.forEach((v, k) => merged.set(k, {
      note: v.note,
      timestamp: v.timestamp,
      velocity: 127,
      channel: 1
    }));
    
    // Suporte a Audio Feedback do Microfone
    if (activeAudioNote) {
      merged.set(activeAudioNote.note, {
        note: activeAudioNote.note,
        timestamp: Date.now(),
        velocity: 100,
        channel: 1
      });
    }

    return merged;
  }, [simulatedActiveNotes, activeAudioNote]);

  const handleScoreUpdate = useCallback((newScore: number, newCombo: number, newAccuracy: number) => {
    setScore(newScore);
    setCombo(newCombo);
    setAccuracy(newAccuracy);
  }, []);

  const handleSongEnd = useCallback(async () => {
    setGameState("finished");
    
    if (songId && song) {
      await recordPracticeSession(
        song.duration || 0,
        accuracy,
        true
      );
    }
  }, [songId, song, accuracy, recordPracticeSession]);

  const restartGame = () => {
    playClick();
    setScore(0);
    setCombo(0);
    setAccuracy(0);
    setGameState("idle");
    setTimeout(() => setGameState("playing"), 100);
  };

  const handlePlayAccompaniment = useCallback((midi: number, duration: number) => {
    if (audioEnabled) {
      audioEngine.scheduleAccompaniment(midi, audioEngine.getCurrentTime(), duration, 0.6);
    }
  }, [audioEngine, audioEnabled]);

  // Loading and Error States
  if (!song) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Música não encontrada</h1>
          <p className="text-white/50 mb-8">Não conseguimos localizar a música solicitada na nossa biblioteca.</p>
          <button 
            onClick={() => router.push("/dashboard/songs")}
            className="px-8 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all"
          >
            Voltar para Biblioteca
          </button>
        </div>
      </div>
    );
  }

  // Se não estiver inscrito e for música Pro, bloqueia
  if (!isSubscribed && !subscriptionLoading && song.isPremium) {
     router.push("/dashboard/membership");
     return null;
  }

  return (
    <>
      <Header />
      <StarryBackground />

      <main className="relative min-h-screen bg-transparent text-white pt-24 pb-12 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-6">
          
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { playClick(); router.push("/dashboard/songs"); }}
                className="w-12 h-12 rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-white/50" />
              </button>
              <div>
                <h1 className="text-2xl font-bold font-geist-sans">{song.title}</h1>
                <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">{song.artist}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
               <div className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 font-semibold text-white/60">
                 Tempo: <span className="text-white">{Math.round(tempo * 100)}%</span>
               </div>
               <div className="text-xs px-3 py-1 rounded-full border border-magenta/20 bg-magenta/5 font-semibold text-magenta">
                  Dificuldade: <span className="uppercase">{difficulty}</span>
               </div>
            </div>
          </div>

          {/* HUD Score */}
          <div className="flex justify-center">
            <div className="flex items-center gap-12 glass p-4 px-12 rounded-3xl border border-white/5 shadow-2xl">
               <div className="text-center">
                 <p className="text-[10px] uppercase tracking-tighter text-white/30 font-bold mb-1">Pontos</p>
                 <p className="text-2xl font-black text-gradient tabular-nums">{score}</p>
               </div>
               <div className="text-center relative">
                 <p className="text-[10px] uppercase tracking-tighter text-white/30 font-bold mb-1">Combo</p>
                 <p className="text-2xl font-black text-white tabular-nums">x{combo}</p>
                 {combo > 5 && (
                   <motion.div 
                     initial={{ scale: 0.5, opacity: 0 }} 
                     animate={{ scale: 1, opacity: 1 }}
                     className="absolute -top-4 -right-8 w-6 h-6 rounded-full bg-magenta/20 border border-magenta/40 flex items-center justify-center"
                   >
                     <p className="text-[10px] font-bold text-magenta">!</p>
                   </motion.div>
                 )}
               </div>
               <div className="text-center">
                 <p className="text-[10px] uppercase tracking-tighter text-white/30 font-bold mb-1">Precisão</p>
                 <p className="text-2xl font-black text-white tabular-nums">{accuracy}%</p>
               </div>
            </div>
          </div>

          {/* Piano Game Area */}
          <div className="flex-1 min-h-0 relative glass rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {!audioEngine ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50">
                <Loader2 className="w-12 h-12 text-cyan animate-spin mb-4" />
                <p className="text-cyan font-bold animate-pulse tracking-widest text-xs uppercase">Carregando Sons Mágicos...</p>
              </div>
            ) : gameState === "idle" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-40 p-8 text-center">
                 <div className="w-20 h-20 rounded-3xl bg-cyan/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,234,255,0.2)]">
                   <Play size={40} className="text-cyan ml-1" />
                 </div>
                 <h2 className="text-4xl font-bold mb-4 font-geist-sans">Pronto para começar?</h2>
                 <p className="text-white/50 max-w-sm mb-10 text-lg">Toque seu piano ou pressione o botão abaixo para iniciar a música.</p>
                 
                 <div className="flex flex-col md:flex-row gap-4">
                   <button 
                     onClick={() => restartGame()}
                     className="px-10 py-4 bg-gradient-to-r from-cyan to-magenta text-white font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-lg"
                   >
                     Começar Aula <Play size={20} />
                   </button>
                   
                   <button 
                     onClick={() => router.push("/dashboard/songs")}
                     className="px-8 py-4 bg-white/5 text-white/50 font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                   >
                     Mudar Música
                   </button>
                 </div>
              </div>
            ) : null}

            {/* Piano Player Core Engine */}
            <PianoPlayer
              notes={songNotes}
              difficulty={difficulty}
              activeNotes={activeNotes}
              isPlaying={gameState === "playing"}
              getAudioTime={() => (audioEngine.getCurrentTime())}
              onScoreUpdate={handleScoreUpdate}
              onSongEnd={handleSongEnd}
              onPlayNote={handleSimulatedPlay}
              onReleaseNote={handleSimulatedRelease}
              isFreePlay={song.id === "free-practice"}
              isWaitingMode={isWaitingMode}
              onPlayAccompaniment={handlePlayAccompaniment}
              playbackSpeed={tempo}
              songDuration={song.duration}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 glass p-3 px-6 rounded-2xl border border-white/5">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Modo Espera</span>
                   <button 
                     onClick={() => { playClick(); setIsWaitingMode(!isWaitingMode); }}
                     className={`w-10 h-5 rounded-full relative transition-colors ${isWaitingMode ? 'bg-cyan' : 'bg-white/10'}`}
                   >
                     <motion.div 
                        animate={{ x: isWaitingMode ? 22 : 2 }}
                        className="w-4 h-4 rounded-full bg-white absolute top-0.5" 
                     />
                   </button>
                </div>
                
                <div className="h-4 w-px bg-white/10" />
                
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Velocidade</span>
                   <div className="flex items-center gap-1">
                      {[0.5, 0.75, 1.0].map(s => (
                        <button 
                          key={s}
                          onClick={() => { playClick(); setTempo(s); }}
                          className={`w-10 h-6 text-[10px] font-bold rounded flex items-center justify-center transition-all ${tempo === s ? 'bg-white text-black' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                        >
                          {s}x
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <button 
                  onClick={() => { playClick(); restartGame(); }}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  title="Reiniciar"
                >
                  <Music size={20} />
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <Settings size={20} />
                </button>
             </div>
          </div>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {gameState === "finished" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full glass-card p-10 rounded-3xl border border-cyan/20 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan via-magenta to-cyan" />
                
                <div className="relative mb-8">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
                  >
                    <Trophy className="w-24 h-24 text-amber-400 mx-auto drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                  </motion.div>
                </div>
                
                <h2 className="text-4xl font-black mb-2 text-gradient tracking-tighter uppercase font-geist-sans">Excelente!</h2>
                <p className="text-white/50 mb-10">Você conquistou mais uma música na sua jornada mágica.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Pontuação</p>
                    <p className="text-3xl font-bold text-white">{score}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Precisão</p>
                    <p className="text-3xl font-bold text-cyan">{accuracy}%</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { playClick(); restartGame(); }}
                    className="w-full py-4 bg-white text-black font-extrabold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg"
                  >
                    Jogar Novamente
                  </button>
                  <button 
                    onClick={() => { playClick(); router.push("/dashboard/songs"); }}
                    className="w-full py-4 bg-transparent text-white/50 font-bold rounded-2xl hover:text-white transition-colors"
                  >
                    Voltar para Biblioteca
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
