"use client";

import { useState, useCallback, useEffect, useMemo, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ScoreScreen from "@/components/ScoreScreen";
import OrientationOverlay from "@/components/OrientationOverlay";
import PianoPlayer from "@/components/PianoPlayer";
import GameTutorialOverlay, { shouldAutoOpenGameTutorial } from "@/components/GameTutorialOverlay";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useAudioInput } from "@/hooks/useAudioInput";
import type { Song, SongNote } from "@/lib/types";
import { loadSongById } from "@/lib/songCatalog";
import {
  type Difficulty,
  filterNotesByHandSelection,
  filterNotesByDifficulty,
  getAccompanimentNotes,
  getSongNotesForDifficulty,
  type HandSelection,
} from "@/lib/songFilters";
import { Volume2, Mic, MicOff, Play, Pause, RotateCcw, CircleHelp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useBackgroundMusic } from "@/contexts/AudioContext";
import { useProfile } from "@/hooks/useProfile";

const FREE_PLAY_SONG: Song = {
  id: "freeplay",
  title: "Pratica Livre",
  artist: "Sintetizador Livre",
  category: "Para Iniciantes",
  isPremium: false,
  difficulty: "Facil",
  duration: 0,
  bpm: 120,
  coverUrl: "",
  notes: [],
};

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-white">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
          <span className="text-xs font-bold uppercase tracking-[4px] opacity-40">Sincronizando...</span>
        </div>
      }
    >
      <PlayPageContent />
    </Suspense>
  );
}

function PlayPageContent() {
  const pageRef = useRef<HTMLDivElement>(null);
  const volumeControlRef = useRef<HTMLButtonElement>(null);
  const tutorialControlRef = useRef<HTMLButtonElement>(null);
  const micControlRef = useRef<HTMLButtonElement>(null);
  const pauseShortcutRef = useRef<HTMLDivElement>(null);
  const loopControlRef = useRef<HTMLDivElement>(null);
  const speedControlRef = useRef<HTMLDivElement>(null);
  const waitingControlRef = useRef<HTMLButtonElement>(null);
  const metronomeControlRef = useRef<HTMLDivElement>(null);
  const restartControlRef = useRef<HTMLButtonElement>(null);
  const scoreTargetRef = useRef<HTMLDivElement>(null);
  const comboTargetRef = useRef<HTMLDivElement>(null);
  const accuracyTargetRef = useRef<HTMLDivElement>(null);
  const progressTargetRef = useRef<HTMLDivElement>(null);
  const keyboardTargetRef = useRef<HTMLDivElement>(null);

  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const songId = params.songId as string;
  const isFreePlay = songId === "freeplay";
  const [song, setSong] = useState<Song | undefined>(isFreePlay ? FREE_PLAY_SONG : undefined);
  const [songLoading, setSongLoading] = useState(!isFreePlay);

  const { isPro, loading: subLoading } = useSubscription();
  const { profile, recordPracticeSession } = useProfile();

  const {
    isListening: isMicActive,
    activeAudioNote,
    activeAudioNotes,
    inputLevel,
    calibrationProfile,
    start: startMic,
    stop: stopMic,
  } = useAudioInput();

  const { pauseBackgroundMusic } = useBackgroundMusic();
  const audio = useAudioEngine();

  useEffect(() => {
    pauseBackgroundMusic();
    return () => {
      // Intentionally keep background music paused after leaving the game.
    };
  }, [pauseBackgroundMusic]);

  useEffect(() => {
    if (isFreePlay) {
      setSong(FREE_PLAY_SONG);
      setSongLoading(false);
      return;
    }

    let mounted = true;
    setSongLoading(true);

    loadSongById(songId).then((loadedSong) => {
      if (!mounted) return;
      setSong(loadedSong);
      setSongLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isFreePlay, songId]);

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
  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isWaitingMode, setIsWaitingMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [metronomeVolume, setMetronomeVolume] = useState(0.08);
  const [showMicHint, setShowMicHint] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const hasRecordedSessionRef = useRef(false);

  useEffect(() => {
    setShowTutorial(shouldAutoOpenGameTutorial());
  }, []);

  useKeyboardInput();

  const handSelection = useMemo<HandSelection>(() => {
    const includeLeftHand = searchParams.get("leftHand") === "true";
    const rightHandParam = searchParams.get("rightHand");
    const includeRightHand = rightHandParam === null ? true : rightHandParam === "true";

    return {
      includeLeftHand,
      includeRightHand,
    };
  }, [searchParams]);

  useEffect(() => {
    hasRecordedSessionRef.current = false;
  }, [song?.id, difficulty, handSelection.includeLeftHand, handSelection.includeRightHand]);

  const activeNotes = useMemo(() => {
    const merged = new Map<number, PianoNoteRecord>();

    const detectedNotes = activeAudioNotes.length > 0 ? activeAudioNotes : activeAudioNote ? [activeAudioNote] : [];

    for (const detectedNote of detectedNotes) {
      merged.set(detectedNote.note, {
        note: detectedNote.note,
        velocity: 80,
        channel: 1,
        timestamp: detectedNote.timestamp || performance.now(),
      });
    }

    return merged;
  }, [activeAudioNote, activeAudioNotes]);

  const micHealth = useMemo(() => {
    if (!isMicActive) {
      return {
        tone: "neutral" as const,
        title: "Microfone desligado",
        message: "Ligue o microfone para validar as notas pelo piano real.",
      };
    }

    if (!calibrationProfile) {
      return {
        tone: "warning" as const,
        title: "Calibracao recomendada",
        message: "Esse aluno ainda nao calibrou o microfone neste navegador. A precisao pode cair em acordes.",
      };
    }

    const noiseRatio = inputLevel / Math.max(calibrationProfile.silenceRms, 0.0001);
    const signalRatio = inputLevel / Math.max(calibrationProfile.minSignalRms, 0.0001);

    if (noiseRatio > 1.8 && activeNotes.size === 0) {
      return {
        tone: "warning" as const,
        title: "Ruido ambiente alto",
        message: "O microfone esta ouvindo muito ruido sem notas claras. Afaste-se de caixas de som ou recalibre o ambiente.",
      };
    }

    if (activeNotes.size > 0 && signalRatio < 0.9) {
      return {
        tone: "warning" as const,
        title: "Sinal fraco",
        message: "As notas estao chegando perto do limite minimo. Aumente o ganho do microfone ou aproxime o dispositivo do piano.",
      };
    }

    return {
      tone: "good" as const,
      title: "Microfone estavel",
      message: "A captura esta dentro do perfil calibrado para o jogo.",
    };
  }, [activeNotes.size, calibrationProfile, inputLevel, isMicActive]);

  const startGame = useCallback(() => {
    setGameState("countdown");
    setCountdown(3);
    setIsPaused(false);
    setCurrentPlaybackTime(0);
    audio.resume();
  }, [audio]);

  const restartGame = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setGameState("idle");
    setFinalScore({ score: 0, combo: 0, accuracy: 100 });
    setShowMicHint(true);
    setCurrentPlaybackTime(0);
  }, []);

  useEffect(() => {
    const handleSpaceBar = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();

      if (gameState === "playing") {
        setIsPaused((current) => {
          const nextPaused = !current;
          if (nextPaused) {
            void audio.suspend();
          } else {
            void audio.resume();
          }
          setIsPlaying(!nextPaused);
          return nextPaused;
        });
      } else if (gameState === "idle") {
        startGame();
      }
    };

    window.addEventListener("keydown", handleSpaceBar);
    return () => window.removeEventListener("keydown", handleSpaceBar);
  }, [audio, gameState, startGame]);

  useEffect(() => {
    if (gameState !== "countdown" || countdown === null) return;

    audio.playTick(0.15);

    if (countdown > 0) {
      const timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => window.clearTimeout(timer);
    }

    const leadTime = 4;
    const startTime = audio.getCurrentTime() + leadTime;
    setAudioStartTime(startTime);
    setGameState("playing");
    setIsPlaying(true);
    setCountdown(null);
  }, [countdown, gameState, audio]);

  const handleScoreUpdate = useCallback((score: number, combo: number, accuracy: number) => {
    setFinalScore({ score, combo, accuracy });
  }, []);

  const handleSongEnd = useCallback(
    async (summary: { score: number; combo: number; accuracy: number; elapsed: number; completed: boolean }) => {
      setFinalScore({
        score: summary.score,
        combo: summary.combo,
        accuracy: Math.round(summary.accuracy),
      });
      setIsPlaying(false);
      setGameState("ended");

      if (isFreePlay || !profile || !song || hasRecordedSessionRef.current) {
        return;
      }

      hasRecordedSessionRef.current = true;
      await recordPracticeSession({
        seconds: summary.elapsed,
        accuracy: summary.accuracy,
        completed: summary.completed,
        score: summary.score,
        combo: summary.combo,
        songId: song.id,
        songTitle: song.title,
        difficulty,
        handMode:
          handSelection.includeLeftHand && handSelection.includeRightHand
            ? "both"
            : handSelection.includeRightHand
              ? "right"
              : handSelection.includeLeftHand
                ? "left"
                : "unknown",
      });
    },
    [difficulty, handSelection.includeLeftHand, handSelection.includeRightHand, isFreePlay, profile, recordPracticeSession, song],
  );

  const handleSetLoopStart = useCallback(() => {
    const safeCurrent = Math.max(0, Math.min(currentPlaybackTime, Math.max(song?.duration ?? 0, 0)));
    setLoopStart(safeCurrent);
    setLoopEnd((currentEnd) => {
      if (currentEnd <= safeCurrent) {
        return Math.min((song?.duration ?? 0), safeCurrent + 8);
      }
      return currentEnd;
    });
    setIsLoopEnabled(true);
  }, [currentPlaybackTime, song?.duration]);

  const handleSetLoopEnd = useCallback(() => {
    const duration = song?.duration ?? 0;
    const safeCurrent = Math.max(0, Math.min(currentPlaybackTime, duration));
    setLoopEnd(safeCurrent <= loopStart ? Math.min(duration, loopStart + 8) : safeCurrent);
    setIsLoopEnabled(true);
  }, [currentPlaybackTime, loopStart, song?.duration]);

  const handleClearLoop = useCallback(() => {
    setIsLoopEnabled(false);
    setLoopStart(0);
    setLoopEnd(song?.duration ?? 0);
  }, [song?.duration]);

  useEffect(() => {
    const duration = song?.duration ?? 0;
    setCurrentPlaybackTime(0);
    setLoopStart(0);
    setLoopEnd(duration);
    setIsLoopEnabled(false);
  }, [song?.duration, song?.id, difficulty]);

  const loopDuration = Math.max(0, loopEnd - loopStart);
  const formatLoopTime = useCallback((value: number) => {
    const safe = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);
  const songDuration = Math.max(song?.duration ?? 0, 0);
  const playbackProgress = songDuration > 0 ? Math.min(100, (currentPlaybackTime / songDuration) * 100) : 0;
  const loopStartProgress = songDuration > 0 ? Math.min(100, (loopStart / songDuration) * 100) : 0;
  const loopEndProgress = songDuration > 0 ? Math.min(100, (loopEnd / songDuration) * 100) : 100;

  const handlePlayAccompaniment = useCallback(
    (midi: number, duration: number) => {
      if (audioEnabled) {
        audio.scheduleAccompaniment(midi, audio.getCurrentTime(), duration, 0.6);
      }
    },
    [audio, audioEnabled],
  );

  useEffect(() => {
    const leftHand = handSelection.includeLeftHand;
    const rightHand = handSelection.includeRightHand;
    const mic = searchParams.get("mic") === "true";
    const queryDifficulty = searchParams.get("difficulty");

    if (leftHand || rightHand) {
      const isBothHands = leftHand && rightHand;
      if (queryDifficulty === "beginner" || queryDifficulty === "medium" || queryDifficulty === "pro") {
        setDifficulty(queryDifficulty);
      } else {
        setDifficulty(isBothHands ? "pro" : "medium");
      }
      if (mic) startMic();
    }
  }, [handSelection, searchParams, startMic]);

  useEffect(() => {
    if (gameState !== "idle") return;

    if (activeNotes.size > 0) {
      startGame();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") return;
      startGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNotes, gameState, startGame]);

  const filteredNotes = useMemo<SongNote[]>(() => {
    if (!song) return [];

    const isBothHands = handSelection.includeLeftHand && handSelection.includeRightHand;

    const arrangementNotes = getSongNotesForDifficulty(song, difficulty, {
      preferOneHand: !isBothHands,
      handSelection,
    });
    if (arrangementNotes.length > 0) return arrangementNotes;

    return filterNotesByHandSelection(filterNotesByDifficulty(song.notes, difficulty), handSelection);
  }, [song, difficulty, handSelection]);

  const accompanimentNotes = useMemo<SongNote[]>(() => {
    if (!song) return [];

    const isBothHands = handSelection.includeLeftHand && handSelection.includeRightHand;

    const arrangementNotes = getSongNotesForDifficulty(song, difficulty, {
      preferOneHand: !isBothHands,
      handSelection: { includeLeftHand: true, includeRightHand: true },
    });
    if (arrangementNotes.length > 0) {
      if (!isBothHands && handSelection.includeRightHand) {
        const leftHandBacking = filterNotesByHandSelection(arrangementNotes, {
          includeLeftHand: true,
          includeRightHand: false,
        });
        if (leftHandBacking.length > 0) {
          return leftHandBacking;
        }
      }

      return getAccompanimentNotes(arrangementNotes, difficulty);
    }

    return getAccompanimentNotes(song.notes, difficulty);
  }, [song, difficulty, handSelection]);

  if (songLoading || subLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-white">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
        <span className="text-xs font-bold uppercase tracking-[4px] opacity-40">Carregando musica...</span>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Musica nao encontrada</h1>
        <Link href="/dashboard/songs" className="text-cyan hover:underline">
          Voltar para a biblioteca
        </Link>
      </div>
    );
  }

  if (song.isPremium && !isPro) {
    router.push("/dashboard/songs");
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-white">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-rose-500/20 border-t-rose-500" />
        <span className="text-sm font-bold uppercase tracking-widest text-rose-400">Acesso Restrito</span>
        <p className="mt-2 text-xs text-white/40">Esta musica requer uma assinatura PRO. Redirecionando...</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative flex min-h-screen flex-col overflow-hidden bg-black font-sans text-white">
      <OrientationOverlay />

      <GameTutorialOverlay
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        containerRef={pageRef}
        targets={{
          volume: volumeControlRef,
          tutorial: tutorialControlRef,
          mic: micControlRef,
          pauseShortcut: pauseShortcutRef,
          loop: loopControlRef,
          speed: speedControlRef,
          waiting: waitingControlRef,
          metronome: metronomeControlRef,
          restart: restartControlRef,
          score: scoreTargetRef,
          combo: comboTargetRef,
          accuracy: accuracyTargetRef,
          progress: progressTargetRef,
          keyboard: keyboardTargetRef,
        }}
      />

      <div
        className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-3 md:px-5"
        style={{ background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-2">
          <Link href="/dashboard/songs" className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-bold leading-none">{song.title}</h1>
            <p className="mt-0.5 text-[8px] uppercase tracking-widest text-white/35">{song.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            ref={volumeControlRef}
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`rounded-lg p-1.5 transition-colors ${audioEnabled ? "text-cyan" : "text-white/25"}`}
            title="Volume"
          >
            <Volume2 size={16} />
          </button>

          <button
            ref={tutorialControlRef}
            onClick={() => setShowTutorial(true)}
            className="rounded-lg p-1.5 text-white/35 transition-colors hover:text-white"
            title="Tutorial da tela"
          >
            <CircleHelp size={16} />
          </button>

          <button
            ref={micControlRef}
            onClick={() => (isMicActive ? stopMic() : startMic())}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
              isMicActive
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                : "border-transparent text-white/30 hover:text-white/50"
            }`}
            title="Microfone"
          >
            {isMicActive ? <Mic size={13} /> : <MicOff size={13} />}
            <span className="hidden md:inline">{isMicActive ? "MIC ON" : "MIC OFF"}</span>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div
            ref={pauseShortcutRef}
            className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 md:flex"
            title="Atalho de teclado para pausar"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Espaco</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">pausa</span>
          </div>

          <div className="hidden h-5 w-px bg-white/10 md:block" />

          <div className="flex items-center gap-1">
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase leading-none tracking-widest text-white/25">Resolucao</p>
              <p className="mt-0.5 text-[10px] font-black leading-none text-white">Full HD</p>
            </div>
            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20">
              <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
            </div>
          </div>

          {!isFreePlay && song.duration > 0 && (
            <>
              <div className="h-5 w-px bg-white/10" />

              <div ref={loopControlRef} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1">
                <button
                  onClick={() => setIsLoopEnabled((current) => !current)}
                  className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
                    isLoopEnabled ? "bg-cyan/15 text-cyan" : "text-white/40 hover:text-white/70"
                  }`}
                  title="Ativar loop do trecho"
                >
                  Loop
                </button>
                <button
                  onClick={handleSetLoopStart}
                  className="rounded-lg bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/70 transition-colors hover:bg-white/15"
                  title="Marcar inicio do loop no ponto atual"
                >
                  A
                </button>
                <button
                  onClick={handleSetLoopEnd}
                  className="rounded-lg bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/70 transition-colors hover:bg-white/15"
                  title="Marcar fim do loop no ponto atual"
                >
                  B
                </button>
                <button
                  onClick={handleClearLoop}
                  className="rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-rose-300"
                  title="Limpar loop"
                >
                  Limpar
                </button>
                <div className="hidden min-w-[180px] lg:block">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
                    <span>
                      {isLoopEnabled && loopDuration > 0
                        ? `${formatLoopTime(loopStart)} - ${formatLoopTime(loopEnd)}`
                        : "Trecho completo"}
                    </span>
                    <span>{formatLoopTime(currentPlaybackTime)}</span>
                  </div>
                  <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
                    <div
                      className={`absolute inset-y-0 rounded-full transition-all ${
                        isLoopEnabled && loopDuration > 0 ? "bg-cyan/60" : "bg-white/20"
                      }`}
                      style={{
                        left: `${loopStartProgress}%`,
                        width: `${Math.max(loopEndProgress - loopStartProgress, isLoopEnabled ? 2 : 100)}%`,
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow-[0_0_10px_rgba(255,255,255,0.35)] transition-[left] duration-150"
                      style={{ left: `calc(${playbackProgress}% - 6px)` }}
                    />
                  </div>
                </div>
              </div>

              <div className="h-5 w-px bg-white/10" />
            </>
          )}

          <div ref={speedControlRef} className="flex items-center gap-1">
            <span className="hidden text-[8px] font-bold uppercase tracking-wider text-white/25 md:inline">Vel</span>
            <button
              onClick={() => setPlaybackSpeed(Math.max(0.15, playbackSpeed - 0.05))}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              -
            </button>
            <span className="min-w-[36px] text-center text-[10px] font-black text-cyan">{Math.round(playbackSpeed * 100)}%</span>
            <button
              onClick={() => setPlaybackSpeed(Math.min(1.1, playbackSpeed + 0.05))}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              +
            </button>
          </div>

          <div className="h-5 w-px bg-white/10" />

          <button
            ref={waitingControlRef}
            onClick={() => setIsWaitingMode(!isWaitingMode)}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-all ${
              isWaitingMode ? "border-cyan/30 bg-cyan/15 text-cyan" : "border-transparent text-white/30 hover:text-white/50"
            }`}
          >
            <Play size={11} className={isWaitingMode ? "fill-cyan" : ""} />
            <span className="hidden md:inline">Espera</span>
            <span className={`text-[9px] font-black ${isWaitingMode ? "text-cyan" : "text-white/40"}`}>
              {isWaitingMode ? "ON" : "OFF"}
            </span>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div ref={metronomeControlRef} className="flex items-center gap-1">
            <span className="hidden text-[8px] font-bold uppercase tracking-wider text-white/25 md:inline">Met</span>
            <button
              onClick={() => setMetronomeVolume(Math.max(0, metronomeVolume - 0.02))}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              -
            </button>
            <span className="min-w-[30px] text-center text-[10px] font-black text-white/60">
              {Math.round(metronomeVolume * 100)}%
            </span>
            <button
              onClick={() => setMetronomeVolume(Math.min(0.5, metronomeVolume + 0.02))}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              +
            </button>
          </div>

          <div className="h-5 w-px bg-white/10" />

          <button
            ref={restartControlRef}
            onClick={restartGame}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-white/30 transition-all hover:bg-rose-500/10 hover:text-rose-400"
            title="Reiniciar musica"
          >
            <RotateCcw size={13} />
            <span className="hidden text-[9px] font-bold uppercase tracking-wider lg:inline">Reiniciar</span>
          </button>

          {isPaused && gameState === "playing" && (
            <div className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-amber-400">
              <Pause size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">Pausado</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {showMicHint && (
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex justify-center md:left-auto md:right-5 md:top-4 md:justify-end">
            <div
              className={`pointer-events-auto max-w-md rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md ${
                micHealth.tone === "good"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                  : micHealth.tone === "warning"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                    : "border-white/10 bg-black/45 text-white/75"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em]">{micHealth.title}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">{micHealth.message}</p>
                  {micHealth.tone !== "good" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => router.push("/dashboard/test-audio")}
                        className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-black transition hover:bg-white/90"
                      >
                        Recalibrar
                      </button>
                      <button
                        onClick={() => setShowMicHint(false)}
                        className="rounded-xl border border-white/15 px-3 py-1.5 text-[11px] font-bold text-current/80 transition hover:border-white/30 hover:text-current"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {gameState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full cursor-pointer select-none flex-col items-center justify-center p-12 text-center"
              onClick={startGame}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-6"
              >
                <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/20">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-white/10 blur-xl" />
                  <Play size={40} className="absolute text-white" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-[8px] text-white">Aperte uma tecla para comecar</h2>
                <p className="text-xs font-bold uppercase tracking-[4px] text-cyan/60">O estudio esta pronto e te esperando</p>
              </motion.div>
            </motion.div>
          )}

          {gameState === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="flex h-full flex-col items-center justify-center p-12 text-center"
            >
              <motion.div
                key={countdown}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="flex flex-col items-center"
              >
                <span className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] md:text-9xl">
                  {countdown === 0 ? "VAI!" : countdown}
                </span>
                <p className="mt-8 animate-pulse text-xs font-bold uppercase tracking-[10px] text-cyan">Prepare-se</p>
              </motion.div>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
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
                onPlayTick={(value) => audio.playTick(value || metronomeVolume)}
                isWaitingMode={isWaitingMode}
                onPlayAccompaniment={handlePlayAccompaniment}
                accompanimentNotes={accompanimentNotes}
                playbackSpeed={playbackSpeed}
                startNote={36}
                endNote={84}
                loopRegion={{
                  enabled: isLoopEnabled && loopDuration >= 1,
                  start: loopStart,
                  end: loopEnd,
                }}
                onProgressChange={setCurrentPlaybackTime}
                tutorialTargets={{
                  scoreRef: scoreTargetRef,
                  comboRef: comboTargetRef,
                  accuracyRef: accuracyTargetRef,
                  progressRef: progressTargetRef,
                  keyboardRef: keyboardTargetRef,
                }}
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
