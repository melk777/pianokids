"use client";

import { useState, useCallback, useEffect, useMemo, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ScoreScreen from "@/components/ScoreScreen";
import OrientationOverlay from "@/components/OrientationOverlay";
import PianoPlayer from "@/components/PianoPlayer";
import LatencyCalibration from "@/components/LatencyCalibration";
import { readStoredLatencyMs, storeLatencyMs } from "@/lib/latencyCalibration";
import GameTutorialOverlay, {
  type GameTutorialActionId,
  type GameTutorialStep,
  shouldAutoOpenGameTutorial,
} from "@/components/GameTutorialOverlay";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useAudioInput } from "@/hooks/useAudioInput";
import { useMIDI } from "@/hooks/useMIDI";
import type { PracticeFeedbackSummary, Song, SongNote } from "@/lib/types";
import { loadSongById } from "@/lib/songCatalog";
import {
  type Difficulty,
  filterNotesByHandSelection,
  filterNotesByDifficulty,
  getSongNotesForDifficulty,
  type HandSelection,
} from "@/lib/songFilters";
import {
  ArrowLeft,
  Cable,
  CircleHelp,
  Gauge,
  Hand,
  Mic,
  MicOff,
  Music,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Timer,
  TimerReset,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const FINGERING_STORAGE_KEY = "pianify.showFingering";

const NON_STARTING_KEYS =new Set(["Enter", "Tab", "Escape", "Shift", "Control", "Alt", "Meta", "CapsLock"]);

// Shared toolbar styles keep every control the same height and contrast.
const TOOLBAR_GROUP = "flex h-10 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-1";
const TOOLBAR_BUTTON = "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors";
const TOOLBAR_IDLE = "text-white/65 hover:bg-white/8 hover:text-white";
const TOOLBAR_ACTIVE = "bg-cyan/15 text-cyan";
const TOOLBAR_ACTIVE_GREEN = "bg-emerald-500/15 text-emerald-300";
const TOOLBAR_STEPPER =
  "grid h-7 min-w-7 place-items-center rounded-md bg-white/8 px-1.5 text-sm font-bold text-white/80 transition-colors hover:bg-white/15 hover:text-white";
import { useBackgroundMusic } from "@/contexts/AudioContext";
import { useProfile } from "@/hooks/useProfile";
import { trackEvent } from "@/lib/analytics";
import { PIANO_END_MIDI, PIANO_START_MIDI } from "@/lib/pianoRange";

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

const DEFAULT_FEEDBACK: PracticeFeedbackSummary = {
  totalNotes: 0,
  hits: 0,
  misses: 0,
  wrongNotes: 0,
  perfectHits: 0,
  earlyHits: 0,
  lateHits: 0,
  maxCombo: 0,
  cleanLoopPasses: 0,
  averageTimingMs: 0,
  problemNotes: [],
  weakestRange: null,
  recommendation: "Toque uma música para receber uma recomendação personalizada.",
};

const TUTORIAL_SIMULATION_NOTES: SongNote[] = [
  { midi: 60, time: 0.8, duration: 0.65, velocity: 0.82, hand: "right" },
  { midi: 48, time: 1.55, duration: 2.15, velocity: 0.72, hand: "left" },
  { midi: 64, time: 1.65, duration: 0.65, velocity: 0.84, hand: "right" },
  { midi: 67, time: 2.5, duration: 0.7, velocity: 0.86, hand: "right" },
  { midi: 72, time: 3.4, duration: 1.35, velocity: 0.9, hand: "right" },
  { midi: 55, time: 4.85, duration: 2.2, velocity: 0.74, hand: "left" },
  { midi: 64, time: 5.0, duration: 0.65, velocity: 0.82, hand: "right" },
  { midi: 67, time: 5.85, duration: 0.65, velocity: 0.84, hand: "right" },
  { midi: 69, time: 6.7, duration: 0.7, velocity: 0.86, hand: "right" },
  { midi: 67, time: 7.6, duration: 1.35, velocity: 0.88, hand: "right" },
  { midi: 48, time: 9.1, duration: 2.15, velocity: 0.74, hand: "left" },
  { midi: 60, time: 9.25, duration: 1.9, velocity: 0.86, hand: "right" },
];

const TUTORIAL_KEYBOARD_NOTE = 60;

function buildTutorialSimulationNotes(_runId: number) {
  const phraseLength = 12;
  const repetitions = 10;
  const runOffset = _runId * 0;
  const notes: SongNote[] = [];

  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    const timeOffset = repetition * phraseLength + runOffset;
    TUTORIAL_SIMULATION_NOTES.forEach((note) => {
      notes.push({
        ...note,
        time: note.time + timeOffset,
      });
    });
  }

  return notes;
}

const createTutorialActionState = (): Partial<Record<GameTutorialActionId, boolean>> => ({
  keyboard: false,
  speed: false,
  loop: false,
  waiting: false,
});

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
  const loopControlRef = useRef<HTMLDivElement>(null);
  const speedControlRef = useRef<HTMLDivElement>(null);
  const waitingControlRef = useRef<HTMLButtonElement>(null);
  const fallingNotesTargetRef = useRef<HTMLDivElement>(null);
  const hitLineTargetRef = useRef<HTMLDivElement>(null);
  const keyboardTargetRef = useRef<HTMLDivElement>(null);
  const lastPauseTouchRef = useRef(0);

  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const songId = params.songId as string;
  const isFreePlay = songId === "freeplay";
  const [song, setSong] = useState<Song | undefined>(isFreePlay ? FREE_PLAY_SONG : undefined);
  const [songLoading, setSongLoading] = useState(!isFreePlay);
  const [songLoadError, setSongLoadError] = useState<string | null>(null);
  const [songLoadAttempt, setSongLoadAttempt] = useState(0);

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
  const midi = useMIDI();

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Route changes intentionally synchronize the loaded player state.
      setSong(FREE_PLAY_SONG);
      setSongLoading(false);
      return;
    }

    let mounted = true;
    setSongLoading(true);
    setSongLoadError(null);

    loadSongById(songId)
      .then((loadedSong) => {
        if (!mounted) return;
        setSong(loadedSong);
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        console.error("Falha ao carregar música", error);
        setSong(undefined);
        setSongLoadError("Não foi possível carregar esta música agora.");
      })
      .finally(() => {
        if (mounted) setSongLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isFreePlay, songId, songLoadAttempt]);

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
  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100, feedback: DEFAULT_FEEDBACK });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isWaitingMode, setIsWaitingMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [metronomeVolume, setMetronomeVolume] = useState(0.08);
  const [showMicHint, setShowMicHint] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [inputLatencyMs, setInputLatencyMs] = useState(0);
  const [showFingering, setShowFingering] = useState(true);

  useEffect(() => {
    // Browser-only preferences are read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR.
    setInputLatencyMs(readStoredLatencyMs());
    try {
      setShowFingering(window.localStorage.getItem(FINGERING_STORAGE_KEY) !== "0");
    } catch {
      // Keep the default when storage is unavailable.
    }
  }, []);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [tutorialRunId, setTutorialRunId] = useState(0);
  const [playerResetKey, setPlayerResetKey] = useState(0);
  const [tutorialActions, setTutorialActions] = useState<Partial<Record<GameTutorialActionId, boolean>>>(() =>
    createTutorialActionState(),
  );
  const [currentTutorialAction, setCurrentTutorialAction] = useState<GameTutorialActionId | null>(null);
  const [practiceSuggestion, setPracticeSuggestion] = useState<{
    start: number;
    end: number;
    misses: number;
    message: string;
    mastered?: boolean;
  } | null>(null);
  const hasRecordedSessionRef = useRef(false);
  const isTutorialSimulation = showTutorial;

  const completeTutorialAction = useCallback((action: GameTutorialActionId) => {
    setTutorialActions((current) => (current[action] ? current : { ...current, [action]: true }));
  }, []);

  const pauseTutorialSimulation = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
    void audio.suspend();
  }, [audio]);

  const resetTutorialSimulation = useCallback((options?: { speed?: number; loop?: boolean; waiting?: boolean; playing?: boolean }) => {
    const shouldPlay = options?.playing ?? true;
    setTutorialRunId((current) => current + 1);
    setCurrentPlaybackTime(0);
    setIsPaused(!shouldPlay);
    setIsPlaying(shouldPlay);
    setGameState("playing");
    setIsLoopEnabled(Boolean(options?.loop));
    setIsWaitingMode(Boolean(options?.waiting));
    setLoopStart(2);
    setLoopEnd(6);
    if (typeof options?.speed === "number") {
      setPlaybackSpeed(options.speed);
    }
    setAudioStartTime(audio.getCurrentTime());
    if (shouldPlay) {
      void audio.resume();
    } else {
      void audio.suspend();
    }
  }, [audio]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The preference is browser-only and must be read after hydration.
    setShowTutorial(shouldAutoOpenGameTutorial());
  }, []);

  useEffect(() => {
    if (!showTutorial) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Opening the tutorial intentionally resets its state machine.
    setTutorialActions(createTutorialActionState());
    setTutorialRunId((current) => current + 1);
    setGameState("playing");
    setIsPlaying(false);
    setIsPaused(true);
    setCountdown(null);
    setCurrentPlaybackTime(0);
    setLoopStart(2);
    setLoopEnd(8);
    setIsLoopEnabled(false);
    setPlaybackSpeed(0.75);
    setShowMicHint(false);
    setCurrentTutorialAction(null);
    void audio.suspend();
    setAudioStartTime(audio.getCurrentTime());
  }, [audio, showTutorial]);

  const [localInputNotes, setLocalInputNotes] = useState<Map<number, PianoNoteRecord>>(() => new Map());

  const handleLocalPlayNote = useCallback(
    (midiNote: number, velocity = 96, duration = 0.7) => {
      const timestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
      setLocalInputNotes((current) => {
        const next = new Map(current);
        next.set(midiNote, {
          note: midiNote,
          velocity,
          channel: 0,
          timestamp,
        });
        return next;
      });

      if (isTutorialSimulation && currentTutorialAction === "keyboard" && midiNote === TUTORIAL_KEYBOARD_NOTE) {
        completeTutorialAction("keyboard");
        setIsWaitingMode(false);
        window.setTimeout(() => {
          pauseTutorialSimulation();
        }, 1200);
      }

      if (audioEnabled) {
        void audio.resume().then(() => audio.playStudent(midiNote, duration, velocity / 127));
      }
    },
    [audio, audioEnabled, completeTutorialAction, currentTutorialAction, isTutorialSimulation, pauseTutorialSimulation],
  );

  const handleLocalReleaseNote = useCallback((midiNote: number) => {
    setLocalInputNotes((current) => {
      if (!current.has(midiNote)) return current;
      const next = new Map(current);
      next.delete(midiNote);
      return next;
    });
  }, []);

  useKeyboardInput({
    enabled: gameState === "idle" || gameState === "playing",
    onPlayNote: handleLocalPlayNote,
    onReleaseNote: handleLocalReleaseNote,
  });

  useEffect(() => {
    if (!midi.lastNote || !audioEnabled) return;
    const note = midi.lastNote;
    void audio.resume().then(() => audio.playStudent(note.note, 0.7, note.velocity / 127));
  }, [audio, audioEnabled, midi.lastNote]);

  useEffect(() => {
    if (isTutorialSimulation) return;
    if (gameState !== "idle") return;
    const beginnerFriendlySongIds = new Set([
      "atirei-o-pau-no-gato",
      "fui-no-itororo",
      "ciranda-cirandinha",
      "o-cravo-e-a-rosa",
      "onde-esta-a-margarida",
      "pai-francisco",
      "se-essa-rua-fosse-minha",
      "teresinha-de-jesus",
      "alvo-mais-que-a-neve",
      "chuvas-de-graca",
      "deus-velara-por-ti",
      "tao-sublime-sacramento",
      "ave-maria-schubert",
      "in-the-hall-of-the-mountain-king",
      "toccata-and-fugue-d-minor",
    ]);
    const beginnerSpeed =
      song?.id && beginnerFriendlySongIds.has(song.id)
        ? song.bpm <= 30
          ? 1
          : song.bpm <= 60
            ? 0.9
            : 0.75
        : 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Difficulty changes intentionally reset the user-adjustable playback speed.
    setPlaybackSpeed(difficulty === "beginner" ? beginnerSpeed : 1);
  }, [difficulty, gameState, isTutorialSimulation, song?.bpm, song?.id]);

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

    localInputNotes.forEach((note, midiNote) => {
      merged.set(midiNote, note);
    });

    midi.activeNotes.forEach((note, midiNote) => {
      merged.set(midiNote, {
        note: midiNote,
        velocity: note.velocity,
        channel: note.channel,
        timestamp: note.timestamp,
      });
    });

    const detectedNotes = activeAudioNotes.length > 0 ? activeAudioNotes : activeAudioNote ? [activeAudioNote] : [];

    for (const detectedNote of detectedNotes) {
      merged.set(detectedNote.note, {
        note: detectedNote.note,
        velocity: 80,
        channel: 1,
        timestamp: detectedNote.timestamp,
      });
    }

    return merged;
  }, [activeAudioNote, activeAudioNotes, localInputNotes, midi.activeNotes]);

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
        title: "Calibração recomendada",
        message: "Esse aluno ainda não calibrou o microfone neste navegador. A precisão pode cair em acordes.",
      };
    }

    const noiseRatio = inputLevel / Math.max(calibrationProfile.silenceRms, 0.0001);
    const signalRatio = inputLevel / Math.max(calibrationProfile.minSignalRms, 0.0001);

    if (noiseRatio > 1.8 && activeNotes.size === 0) {
      return {
        tone: "warning" as const,
        title: "Ruído ambiente alto",
        message: "O microfone está ouvindo muito ruído sem notas claras. Afaste-se de caixas de som ou recalibre o ambiente.",
      };
    }

    if (activeNotes.size > 0 && signalRatio < 0.9) {
      return {
        tone: "warning" as const,
        title: "Sinal fraco",
        message: "As notas estão chegando perto do limite mínimo. Aumente o ganho do microfone ou aproxime o dispositivo do piano.",
      };
    }

    return {
      tone: "good" as const,
      title: "Microfone estável",
      message: "A captura está dentro do perfil calibrado para o jogo.",
    };
  }, [activeNotes.size, calibrationProfile, inputLevel, isMicActive]);

  const startGame = useCallback(() => {
    setPlayerResetKey((current) => current + 1);
    setGameState("countdown");
    setCountdown(3);
    setIsPaused(false);
    setCurrentPlaybackTime(isLoopEnabled && loopEnd - loopStart >= 1 ? loopStart : 0);
    audio.resume();
  }, [audio, isLoopEnabled, loopEnd, loopStart]);

  const restartGame = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setGameState("idle");
    setFinalScore({ score: 0, combo: 0, accuracy: 100, feedback: DEFAULT_FEEDBACK });
    setShowMicHint(true);
    setCurrentPlaybackTime(0);
    setPracticeSuggestion(null);
    setPlayerResetKey((current) => current + 1);
  }, []);

  const togglePause = useCallback(() => {
    if (gameState === "idle") {
      startGame();
      return;
    }

    if (gameState !== "ended") {
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
    }
  }, [audio, gameState, startGame]);

  useEffect(() => {
    const handleSpaceBar = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      togglePause();
    };

    window.addEventListener("keydown", handleSpaceBar);
    return () => window.removeEventListener("keydown", handleSpaceBar);
  }, [togglePause]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Countdown completion advances the player state machine.
    setAudioStartTime(startTime);
    setGameState("playing");
    setIsPlaying(true);
    setCountdown(null);
  }, [countdown, gameState, audio]);

  const handleScoreUpdate = useCallback((score: number, combo: number, accuracy: number) => {
    setFinalScore((current) => ({ ...current, score, combo, accuracy }));
  }, []);

  const handleSongEnd = useCallback(
    async (summary: {
      score: number;
      combo: number;
      accuracy: number;
      elapsed: number;
      completed: boolean;
      feedback: PracticeFeedbackSummary;
    }) => {
      setFinalScore({
        score: summary.score,
        combo: summary.combo,
        accuracy: Math.round(summary.accuracy),
        feedback: summary.feedback,
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

  const formatLoopTime = useCallback((value: number) => {
    const safe = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const applyPracticeSuggestion = useCallback(() => {
    if (!practiceSuggestion) return;
    const duration = song?.duration ?? 0;
    setLoopStart(Math.max(0, practiceSuggestion.start));
    setLoopEnd(Math.min(duration || practiceSuggestion.end, practiceSuggestion.end));
    if (practiceSuggestion.mastered) {
      setPlaybackSpeed((current) => Math.min(1.25, Math.max(0.75, current + 0.1)));
      setIsWaitingMode(false);
    } else {
      setPlaybackSpeed((current) => Math.min(current, 0.75));
      setIsWaitingMode(true);
    }
    setIsLoopEnabled(true);
  }, [practiceSuggestion, song?.duration]);

  const startFocusedPractice = useCallback(
    (range: { start: number; end: number }) => {
      const duration = song?.duration ?? 0;
      const start = Math.max(0, Math.min(range.start, duration));
      const end = Math.max(start + 4, Math.min(range.end, duration || range.end));

      setIsPlaying(false);
      setIsPaused(false);
      setCountdown(null);
      setAudioStartTime(0);
      setGameState("idle");
      setCurrentPlaybackTime(start);
      setLoopStart(start);
      setLoopEnd(end);
      setIsLoopEnabled(true);
      setPlaybackSpeed(0.65);
      setIsWaitingMode(true);
      setPracticeSuggestion({
        start,
        end,
        misses: finalScore.feedback.weakestRange?.misses ?? 0,
        message: `Treino preparado em ${formatLoopTime(start)}-${formatLoopTime(end)} com velocidade reduzida e modo espera.`,
      });
    },
    [finalScore.feedback.weakestRange?.misses, formatLoopTime, song?.duration],
  );

  useEffect(() => {
    const duration = song?.duration ?? 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Loading a different song intentionally resets playback controls.
    setCurrentPlaybackTime(0);
    setLoopStart(0);
    setLoopEnd(duration);
    setIsLoopEnabled(false);
    setPracticeSuggestion(null);
  }, [song?.duration, song?.id, difficulty]);

  const loopDuration = Math.max(0, loopEnd - loopStart);
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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- URL parameters initialize the interactive player after navigation.
        setDifficulty(queryDifficulty);
      } else {
        setDifficulty(isBothHands ? "pro" : "medium");
      }
      if (mic) startMic();
    }
  }, [handSelection, searchParams, startMic]);

  useEffect(() => {
    if (gameState !== "idle" || showCalibration) return;

    if (activeNotes.size > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- An external MIDI/microphone note intentionally starts the game state machine.
      startGame();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.repeat) return;
      // Navigation keys (e.g. the Enter that closes the tutorial) must not start the song.
      if (NON_STARTING_KEYS.has(event.key)) return;
      startGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNotes, gameState, isTutorialSimulation, showCalibration, startGame]);

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
    if (isBothHands) return [];

    const arrangementNotes = getSongNotesForDifficulty(song, difficulty, {
      preferOneHand: false,
      handSelection: { includeLeftHand: true, includeRightHand: true },
    });
    if (arrangementNotes.length > 0) {
      const backing = filterNotesByHandSelection(arrangementNotes, {
        includeLeftHand: handSelection.includeRightHand,
        includeRightHand: handSelection.includeLeftHand,
      });
      if (backing.length > 0) {
        return backing;
      }
    }

    const fallbackBacking = filterNotesByHandSelection(song.notes, {
      includeLeftHand: handSelection.includeRightHand,
      includeRightHand: handSelection.includeLeftHand,
    });

    if (fallbackBacking.length > 0) return fallbackBacking;

    const fallbackTwoHands = filterNotesByHandSelection(song.notes2Hands ?? [], {
      includeLeftHand: handSelection.includeRightHand,
      includeRightHand: handSelection.includeLeftHand,
    });

    return fallbackTwoHands;
  }, [song, difficulty, handSelection]);

  const tutorialNotes = useMemo(() => buildTutorialSimulationNotes(tutorialRunId), [tutorialRunId]);
  const playerNotes = isTutorialSimulation ? tutorialNotes : filteredNotes;
  const playerDuration = isTutorialSimulation ? 120 : (song?.duration ?? 0);
  const playerAccompanimentNotes = useMemo(() => {
    if (isTutorialSimulation) return [];
    const studentNoteKeys = new Set(playerNotes.map((note) => `${Math.round(note.time * 100)}:${note.midi}`));
    return accompanimentNotes.filter((note) => !studentNoteKeys.has(`${Math.round(note.time * 100)}:${note.midi}`));
  }, [accompanimentNotes, isTutorialSimulation, playerNotes]);
  const completedTutorialActions = tutorialActions;

  const handleTutorialClose = useCallback(() => {
    setShowTutorial(false);
    setIsPlaying(false);
    setIsPaused(false);
    setGameState("idle");
    setCurrentPlaybackTime(0);
    setLoopStart(0);
    setLoopEnd(song?.duration ?? 0);
    setIsLoopEnabled(false);
    setPlayerResetKey((current) => current + 1);
    setTutorialActions(createTutorialActionState());
    setCurrentTutorialAction(null);
    // Suggestions computed during the tutorial demo do not apply to the real song.
    setPracticeSuggestion(null);
  }, [song?.duration]);

  const handleTutorialComplete = useCallback(() => {
    trackEvent("tutorial_completed", {
      songId: song?.id ?? songId,
      difficulty,
      leftHand: handSelection.includeLeftHand,
      rightHand: handSelection.includeRightHand,
    });
    setShowTutorial(false);
    setIsPlaying(false);
    setIsPaused(false);
    setGameState("idle");
    setCountdown(null);
    setAudioStartTime(0);
    setCurrentPlaybackTime(0);
    setFinalScore({ score: 0, combo: 0, accuracy: 100, feedback: DEFAULT_FEEDBACK });
    setLoopStart(0);
    setLoopEnd(song?.duration ?? 0);
    setIsLoopEnabled(false);
    setPlayerResetKey((current) => current + 1);
    setTutorialActions(createTutorialActionState());
    setCurrentTutorialAction(null);
    // Suggestions computed during the tutorial demo do not apply to the real song.
    setPracticeSuggestion(null);
  }, [difficulty, handSelection.includeLeftHand, handSelection.includeRightHand, song?.duration, song?.id, songId]);

  const handleTutorialStepChange = useCallback(
    (step: GameTutorialStep) => {
      if (!isTutorialSimulation) return;
      setCurrentTutorialAction(step.requiredAction ?? null);

      if (step.requiredAction === "keyboard") {
        resetTutorialSimulation({ speed: 0.65, waiting: true, playing: true });
      } else if (step.targetId === "fallingNotes" || step.targetId === "hitLine") {
        resetTutorialSimulation({ speed: 0.7, waiting: false, playing: true });
      } else if (step.requiredAction === "speed") {
        resetTutorialSimulation({ speed: 0.45, playing: true });
      } else if (step.requiredAction === "waiting") {
        resetTutorialSimulation({ speed: 0.7, waiting: false, playing: true });
      } else if (step.requiredAction === "loop") {
        resetTutorialSimulation({ speed: 0.8, loop: false, playing: true });
      } else {
        setPlaybackSpeed((current) => (current < 0.5 ? 0.75 : current));
        // Beginners leave the tutorial with the wait mode they just learned
        // still on, so the first real song adapts to their pace.
        setIsLoopEnabled(false);
        resetTutorialSimulation({ playing: false, waiting: step.scene === "celebration" });
      }
    },
    [isTutorialSimulation, resetTutorialSimulation],
  );

  if (songLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-white">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />
        <span className="text-xs font-bold uppercase tracking-[4px] opacity-40">Carregando música...</span>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">{songLoadError ?? "Música não encontrada"}</h1>
        {songLoadError ? (
          <button
            type="button"
            onClick={() => setSongLoadAttempt((attempt) => attempt + 1)}
            className="btn-primary rounded-full px-6 py-3"
          >
            Tentar novamente
          </button>
        ) : null}
        <Link href="/dashboard/songs" className="text-cyan hover:underline">
          Voltar para a biblioteca
        </Link>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative flex min-h-screen flex-col overflow-hidden bg-black font-sans text-white">
      <OrientationOverlay />

      {showTutorial ? (
        <GameTutorialOverlay
          onClose={handleTutorialClose}
          onComplete={handleTutorialComplete}
          onStepChange={handleTutorialStepChange}
          completedActions={completedTutorialActions}
          containerRef={pageRef}
          targets={{
            loop: loopControlRef,
            speed: speedControlRef,
            waiting: waitingControlRef,
            fallingNotes: fallingNotesTargetRef,
            hitLine: hitLineTargetRef,
            keyboard: keyboardTargetRef,
          }}
        />
      ) : null}

      <header
        className="z-20 flex h-14 shrink-0 items-center gap-3 overflow-hidden border-b border-white/[0.08] px-2 md:px-4"
        style={{ background: "rgba(0, 0, 0, 0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex min-w-0 shrink items-center gap-2.5">
          <Link
            href="/dashboard/songs"
            aria-label="Voltar para a biblioteca"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 max-w-[11rem] lg:max-w-[16rem]">
            <h1 className="truncate text-sm font-bold leading-tight">{song.title}</h1>
            <p className="truncate text-[11px] leading-tight text-white/50">{song.artist}</p>
          </div>
          <button
            data-testid="control-pause"
            data-active={isPaused ? "true" : "false"}
            data-game-state={gameState}
            onClick={() => {
              if (Date.now() - lastPauseTouchRef.current < 700) return;
              togglePause();
            }}
            onTouchStart={(event) => {
              event.preventDefault();
              lastPauseTouchRef.current = Date.now();
              togglePause();
            }}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all ${
              isPaused
                ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                : "border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/10 hover:text-white"
            }`}
            title="Pausar ou continuar (Espaço)"
          >
            {isPaused ? <Play size={14} className="fill-amber-200" /> : <Pause size={14} />}
            <span className="hidden xl:inline">{isPaused ? "Continuar" : "Pausar"}</span>
          </button>
        </div>

        <div
          data-testid="piano-top-controls"
          className="flex min-w-0 flex-1 items-center justify-start gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 md:[&>*:first-child]:ml-auto"
        >
          {isTutorialSimulation && currentTutorialAction === "keyboard" && (
            <div className="hidden items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 py-1.5 text-xs font-bold text-cyan md:flex">
              <kbd className="rounded border border-cyan/40 bg-black/40 px-1.5 font-sans text-[11px] text-white">A</kbd>
              toca o Dó
            </div>
          )}

          {/* Input devices */}
          <div className={TOOLBAR_GROUP}>
            <button
              onClick={() => {
                if (isTutorialSimulation && isMicActive) return;
                return isMicActive ? stopMic() : startMic();
              }}
              aria-pressed={isMicActive}
              className={`${TOOLBAR_BUTTON} ${isMicActive ? TOOLBAR_ACTIVE_GREEN : TOOLBAR_IDLE}`}
              title={isMicActive ? "Desligar microfone" : "Tocar com o microfone (piano acústico)"}
            >
              {isMicActive ? <Mic size={14} /> : <MicOff size={14} />}
              <span className="hidden xl:inline">Microfone</span>
            </button>
            <button
              onClick={() => (midi.isConnected ? midi.disconnect() : void midi.connect())}
              disabled={!midi.isSupported}
              aria-pressed={midi.isConnected}
              className={`${TOOLBAR_BUTTON} ${
                midi.isConnected ? TOOLBAR_ACTIVE : midi.isSupported ? TOOLBAR_IDLE : "cursor-not-allowed text-white/25"
              }`}
              title={midi.error || (midi.isSupported ? "Conectar teclado MIDI" : "Este navegador não suporta teclado MIDI")}
            >
              <Cable size={14} />
              <span className="hidden xl:inline">MIDI</span>
            </button>
          </div>

          {/* Practice tools */}
          <div className={TOOLBAR_GROUP}>
            <div ref={speedControlRef} className="flex items-center gap-1 pl-1.5" title="Velocidade da música">
              <Gauge size={14} className="text-white/55" aria-hidden />
              <span className="hidden text-[11px] font-semibold text-white/60 2xl:inline">Velocidade</span>
              <button
                data-testid="control-speed-down"
                aria-label="Diminuir velocidade"
                onClick={() => {
                  if (isTutorialSimulation) completeTutorialAction("speed");
                  setPlaybackSpeed(Math.max(0.15, playbackSpeed - 0.05));
                  if (isTutorialSimulation) {
                    window.setTimeout(() => pauseTutorialSimulation(), 1600);
                  }
                }}
                className={TOOLBAR_STEPPER}
              >
                −
              </button>
              <span data-testid="control-speed-value" className="min-w-[40px] text-center text-xs font-black tabular-nums text-cyan">
                {Math.round(playbackSpeed * 100)}%
              </span>
              <button
                data-testid="control-speed-up"
                aria-label="Aumentar velocidade"
                onClick={() => {
                  if (isTutorialSimulation) completeTutorialAction("speed");
                  setPlaybackSpeed(Math.min(1.1, playbackSpeed + 0.05));
                  if (isTutorialSimulation) {
                    window.setTimeout(() => pauseTutorialSimulation(), 1600);
                  }
                }}
                className={TOOLBAR_STEPPER}
              >
                +
              </button>
            </div>

            <span className="h-5 w-px bg-white/10" aria-hidden />

            <button
              ref={waitingControlRef}
              data-testid="control-waiting-toggle"
              data-active={isWaitingMode ? "true" : "false"}
              aria-pressed={isWaitingMode}
              onClick={() => {
                if (isTutorialSimulation) {
                  completeTutorialAction("waiting");
                  setIsWaitingMode(true);
                  return;
                }
                setIsWaitingMode((current) => !current);
              }}
              className={`${TOOLBAR_BUTTON} ${isWaitingMode ? TOOLBAR_ACTIVE : TOOLBAR_IDLE}`}
              title="Modo espera: a música para em cada nota até você acertar"
            >
              <TimerReset size={14} />
              <span>Espera</span>
              <span className={`rounded px-1 text-[10px] font-black ${isWaitingMode ? "bg-cyan/20" : "bg-white/8 text-white/45"}`}>
                {isWaitingMode ? "ON" : "OFF"}
              </span>
            </button>

            {((!isFreePlay && song.duration > 0) || isTutorialSimulation) && (
              <>
                <span className="h-5 w-px bg-white/10" aria-hidden />
                <div ref={loopControlRef} className="flex items-center gap-1">
                  <button
                    data-testid="control-loop-toggle"
                    data-active={isLoopEnabled ? "true" : "false"}
                    aria-pressed={isLoopEnabled}
                    onClick={() => {
                      if (isTutorialSimulation) completeTutorialAction("loop");
                      setIsLoopEnabled((current) => (isTutorialSimulation ? true : !current));
                      if (isTutorialSimulation) {
                        window.setTimeout(() => pauseTutorialSimulation(), 2200);
                      }
                    }}
                    className={`${TOOLBAR_BUTTON} ${isLoopEnabled ? TOOLBAR_ACTIVE : TOOLBAR_IDLE}`}
                    title="Repetir um trecho da música"
                  >
                    <Repeat size={14} />
                    <span>Loop</span>
                  </button>
                  <button
                    onClick={() => {
                      if (isTutorialSimulation) completeTutorialAction("loop");
                      handleSetLoopStart();
                    }}
                    className={TOOLBAR_STEPPER}
                    title="Marcar o início do trecho no ponto atual"
                  >
                    A
                  </button>
                  <button
                    onClick={() => {
                      if (isTutorialSimulation) completeTutorialAction("loop");
                      handleSetLoopEnd();
                    }}
                    className={TOOLBAR_STEPPER}
                    title="Marcar o fim do trecho no ponto atual"
                  >
                    B
                  </button>
                  {isLoopEnabled && (
                    <button
                      onClick={handleClearLoop}
                      aria-label="Limpar trecho"
                      className="grid h-7 w-7 place-items-center rounded-md text-white/50 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                      title="Limpar trecho"
                    >
                      <X size={13} />
                    </button>
                  )}
                  <div className="hidden min-w-[170px] px-1.5 2xl:block">
                    <div className="flex items-center justify-between text-[11px] font-semibold tabular-nums text-white/55">
                      <span>
                        {isLoopEnabled && loopDuration > 0
                          ? `${formatLoopTime(loopStart)} – ${formatLoopTime(loopEnd)}`
                          : "Música inteira"}
                      </span>
                      <span>{formatLoopTime(currentPlaybackTime)}</span>
                    </div>
                    <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
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
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-[left] duration-150"
                        style={{ left: `calc(${playbackProgress}% - 5px)` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Metronome */}
          <div className={`${TOOLBAR_GROUP} pl-2`} title="Volume do metrônomo">
            <Music size={14} className="text-white/55" aria-hidden />
            <span className="hidden text-[11px] font-semibold text-white/60 2xl:inline">Metrônomo</span>
            <button
              data-testid="control-metronome-down"
              aria-label="Diminuir metrônomo"
              onClick={() => {
                setMetronomeVolume(Math.max(0, metronomeVolume - 0.02));
                if (isTutorialSimulation) {
                  audio.playTick(Math.max(0.02, metronomeVolume - 0.02));
                }
              }}
              className={TOOLBAR_STEPPER}
            >
              −
            </button>
            <span data-testid="control-metronome-value" className="min-w-[34px] text-center text-xs font-bold tabular-nums text-white/75">
              {Math.round(metronomeVolume * 100)}%
            </span>
            <button
              data-testid="control-metronome-up"
              aria-label="Aumentar metrônomo"
              onClick={() => {
                setMetronomeVolume(Math.min(0.5, metronomeVolume + 0.02));
                if (isTutorialSimulation) {
                  audio.playTick(Math.min(0.5, metronomeVolume + 0.02));
                }
              }}
              className={TOOLBAR_STEPPER}
            >
              +
            </button>
          </div>

          <div className={TOOLBAR_GROUP}>
            <button
              data-testid="control-restart"
              onClick={() => {
                if (isTutorialSimulation) {
                  resetTutorialSimulation();
                  return;
                }
                restartGame();
              }}
              className={`${TOOLBAR_BUTTON} text-white/65 hover:bg-rose-500/10 hover:text-rose-300`}
              title="Reiniciar música"
            >
              <RotateCcw size={14} />
              <span className="hidden 2xl:inline">Reiniciar</span>
            </button>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              aria-pressed={audioEnabled}
              aria-label={audioEnabled ? "Desligar som" : "Ligar som"}
              className={`${TOOLBAR_BUTTON} ${audioEnabled ? "text-white/75 hover:bg-white/8 hover:text-white" : "text-white/35 hover:bg-white/8"}`}
              title={audioEnabled ? "Desligar som" : "Ligar som"}
            >
              {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button
              onClick={() => {
                const next = !showFingering;
                setShowFingering(next);
                try {
                  window.localStorage.setItem(FINGERING_STORAGE_KEY, next ? "1" : "0");
                } catch {
                  // Preference only lasts for this visit when storage is unavailable.
                }
              }}
              aria-pressed={showFingering}
              className={`${TOOLBAR_BUTTON} ${showFingering ? TOOLBAR_ACTIVE : TOOLBAR_IDLE}`}
              title="Mostrar o dedo sugerido (1 = polegar, 5 = mínimo) em cada nota"
            >
              <Hand size={15} />
              <span className="hidden 2xl:inline">Dedos</span>
            </button>
            <button
              onClick={() => {
                if (gameState === "playing" && !isPaused && !isTutorialSimulation) togglePause();
                setShowCalibration(true);
              }}
              disabled={isTutorialSimulation}
              aria-label="Calibrar atraso"
              className={`${TOOLBAR_BUTTON} ${inputLatencyMs > 0 ? "text-cyan hover:bg-white/8" : "text-white/75 hover:bg-white/8 hover:text-white"} disabled:opacity-40`}
              title={`Calibrar atraso de fones e teclado (atual: ${inputLatencyMs} ms)`}
            >
              <Timer size={15} />
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              aria-label="Abrir tutorial"
              className={`${TOOLBAR_BUTTON} text-white/75 hover:bg-white/8 hover:text-white`}
              title="Como tocar (tutorial)"
            >
              <CircleHelp size={15} />
            </button>
          </div>
        </div>
      </header>

      {showCalibration ? (
        <LatencyCalibration
          currentLatencyMs={inputLatencyMs}
          getAudioTime={audio.getCurrentTime}
          playTick={audio.playTick}
          resumeAudio={audio.resume}
          midiSignal={midi.lastNote}
          onSave={(value) => {
            setInputLatencyMs(value);
            storeLatencyMs(value);
          }}
          onClose={() => setShowCalibration(false)}
        />
      ) : null}

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

        {practiceSuggestion && (gameState === "playing" || gameState === "idle") && !isTutorialSimulation && (
          <div className="pointer-events-none absolute bottom-[31%] left-2 right-2 z-30 flex justify-end md:left-auto md:right-4">
            <div data-testid="smart-training-card" className="pointer-events-auto w-full max-w-[280px] rounded-xl border border-cyan/20 bg-black/62 p-2.5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.45),0_0_22px_rgba(34,211,238,0.1)] backdrop-blur-md md:max-w-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan">Treino inteligente</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/70">{practiceSuggestion.message}</p>
                </div>
                <button
                  onClick={() => setPracticeSuggestion(null)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-white/50 transition hover:border-white/30 hover:text-white"
                >
                  Fechar
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                {gameState === "playing" && (
                  <button
                    onClick={applyPracticeSuggestion}
                    className="rounded-lg bg-cyan px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-black transition hover:bg-cyan-300"
                  >
                    {practiceSuggestion.mastered ? "Subir velocidade" : "Treinar trecho"}
                  </button>
                )}
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
              className="flex h-full select-none flex-col items-center justify-center px-6 py-10 text-center"
            >
              <button
                type="button"
                onClick={startGame}
                aria-label="Começar a tocar"
                className="group relative grid h-24 w-24 place-items-center rounded-full border border-cyan/40 bg-cyan/10 text-white shadow-[0_0_60px_rgba(34,211,238,0.25)] transition hover:scale-105 hover:bg-cyan/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                <span className="absolute inset-0 animate-ping rounded-full border border-cyan/30 opacity-40 [animation-duration:2.4s]" aria-hidden />
                <Play size={38} className="ml-1 fill-white" />
              </button>

              <h2 className="mt-7 text-2xl font-black tracking-tight md:text-3xl">
                {isLoopEnabled ? "Trecho pronto para praticar" : "Pronto para tocar?"}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/65">
                {isLoopEnabled
                  ? `Vamos repetir ${formatLoopTime(loopStart)} – ${formatLoopTime(loopEnd)} a ${Math.round(playbackSpeed * 100)}% da velocidade.`
                  : "Aperte qualquer tecla do piano ou clique no botão para começar. As notas vão cair até o teclado."}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-white/70">
                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="flex gap-0.5" aria-hidden>
                    {["A", "S", "D", "F"].map((key) => (
                      <kbd key={key} className="rounded border border-white/20 bg-black/40 px-1.5 font-sans text-[11px] font-bold text-white">
                        {key}
                      </kbd>
                    ))}
                  </span>
                  Dó, Ré, Mi, Fá no computador
                </span>
                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <kbd className="rounded border border-white/20 bg-black/40 px-1.5 font-sans text-[11px] font-bold text-white">Espaço</kbd>
                  pausa
                </span>
                {showFingering && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-amber-200/60 bg-black text-[10px] font-black text-white">1</span>
                    número na nota = dedo (1 polegar … 5 mínimo)
                  </span>
                )}
                <span className={`rounded-full border px-3 py-1.5 ${isWaitingMode ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 bg-white/[0.04]"}`}>
                  Espera {isWaitingMode ? "ligada" : "desligada"} · {Math.round(playbackSpeed * 100)}%
                </span>
              </div>
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
                notes={playerNotes}
                difficulty={difficulty}
                activeNotes={activeNotes}
                isPlaying={isPlaying}
                isFreePlay={isTutorialSimulation}
                songDuration={playerDuration}
                getAudioTime={() => audio.getCurrentTime() - audioStartTime}
                metronomeVolume={metronomeVolume}
                bpm={song.bpm}
                onScoreUpdate={handleScoreUpdate}
                onSongEnd={handleSongEnd}
                onPracticeSuggestion={setPracticeSuggestion}
                onPlayTick={(value) => audio.playTick(value || metronomeVolume)}
                isWaitingMode={isWaitingMode}
                onPlayAccompaniment={handlePlayAccompaniment}
                onPlayNote={handleLocalPlayNote}
                onReleaseNote={handleLocalReleaseNote}
                resumeAudio={audio.resume}
                onNoteHit={() => audio.rewardHit()}
                onNoteMiss={() => audio.penaltyMiss()}
                accompanimentNotes={playerAccompanimentNotes}
                playbackSpeed={playbackSpeed}
                initialPlaybackTime={isLoopEnabled && loopDuration >= 1 ? loopStart : 0}
                resetKey={`${song.id}:${difficulty}:${handSelection.includeLeftHand}:${handSelection.includeRightHand}:${playerResetKey}`}
                startNote={PIANO_START_MIDI}
                endNote={PIANO_END_MIDI}
                loopRegion={{
                  enabled: isLoopEnabled && loopDuration >= 1,
                  start: loopStart,
                  end: loopEnd,
                }}
                onProgressChange={setCurrentPlaybackTime}
                tutorialTargets={{
                  fallingNotesRef: fallingNotesTargetRef,
                  hitLineRef: hitLineTargetRef,
                  keyboardRef: keyboardTargetRef,
                }}
                tutorialHighlightNote={
                  isTutorialSimulation && currentTutorialAction === "keyboard"
                    ? TUTORIAL_KEYBOARD_NOTE
                    : undefined
                }
                showFingering={showFingering}
                judgeHolds={!isMicActive}
                inputLatency={isTutorialSimulation ? 0 : inputLatencyMs / 1000}
              />
            </motion.div>
          )}

          {gameState === "ended" && (
            <ScoreScreen
              score={finalScore.score}
              combo={finalScore.combo}
              accuracy={finalScore.accuracy}
              difficulty={difficulty}
              feedback={finalScore.feedback}
              onRestart={() => {
                restartGame();
              }}
              onPracticeRange={startFocusedPractice}
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
