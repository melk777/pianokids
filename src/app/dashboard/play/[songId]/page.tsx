"use client";

import { useState, useCallback, useEffect, useMemo, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ScoreScreen from "@/components/ScoreScreen";
import OrientationOverlay from "@/components/OrientationOverlay";
import PianoPlayer from "@/components/PianoPlayer";
import GameTutorialOverlay, { type GameTutorialActionId, shouldAutoOpenGameTutorial } from "@/components/GameTutorialOverlay";
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
import { Cable, Volume2, Mic, MicOff, Play, Pause, RotateCcw, CircleHelp } from "lucide-react";
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
  { midi: 60, time: 0.8, duration: 0.55, velocity: 0.8, hand: "right" },
  { midi: 64, time: 1.55, duration: 1.7, velocity: 0.86, hand: "right" },
  { midi: 48, time: 2.2, duration: 2.2, velocity: 0.76, hand: "left" },
  { midi: 67, time: 4.1, duration: 0.65, velocity: 0.88, hand: "right" },
  { midi: 52, time: 4.85, duration: 1.8, velocity: 0.78, hand: "left" },
  { midi: 72, time: 6.1, duration: 2.4, velocity: 0.9, hand: "right" },
  { midi: 55, time: 7.1, duration: 2.1, velocity: 0.82, hand: "left" },
  { midi: 76, time: 9.2, duration: 0.85, velocity: 0.88, hand: "right" },
  { midi: 60, time: 10.2, duration: 2.6, velocity: 0.84, hand: "left" },
  { midi: 79, time: 11.0, duration: 2.6, velocity: 0.92, hand: "right" },
];

const TUTORIAL_KEYBOARD_NOTE = 60;

function buildTutorialSimulationNotes(runId: number) {
  const phraseLength = 12;
  const repetitions = 10;
  const runOffset = runId * 0;
  const notes: SongNote[] = [];

  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    const timeOffset = repetition * phraseLength + runOffset;
    TUTORIAL_SIMULATION_NOTES.forEach((note, index) => {
      notes.push({
        ...note,
        midi: index % 4 === 0 ? note.midi + (repetition % 2) * 12 : note.midi,
        time: note.time + timeOffset,
      });
    });
  }

  return notes;
}

const createTutorialActionState = (): Partial<Record<GameTutorialActionId, boolean>> => ({
  volume: false,
  mic: false,
  pause: false,
  loop: false,
  speed: false,
  waiting: false,
  metronome: false,
  restart: false,
  keyboard: false,
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
  const volumeControlRef = useRef<HTMLButtonElement>(null);
  const tutorialControlRef = useRef<HTMLButtonElement>(null);
  const micControlRef = useRef<HTMLButtonElement>(null);
  const pauseShortcutRef = useRef<HTMLButtonElement>(null);
  const loopControlRef = useRef<HTMLDivElement>(null);
  const speedControlRef = useRef<HTMLDivElement>(null);
  const waitingControlRef = useRef<HTMLButtonElement>(null);
  const metronomeControlRef = useRef<HTMLDivElement>(null);
  const restartControlRef = useRef<HTMLButtonElement>(null);
  const scoreTargetRef = useRef<HTMLDivElement>(null);
  const comboTargetRef = useRef<HTMLDivElement>(null);
  const accuracyTargetRef = useRef<HTMLDivElement>(null);
  const progressTargetRef = useRef<HTMLDivElement>(null);
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
  const [finalScore, setFinalScore] = useState({ score: 0, combo: 0, accuracy: 100, feedback: DEFAULT_FEEDBACK });
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
    setShowTutorial(shouldAutoOpenGameTutorial());
  }, []);

  useEffect(() => {
    if (!showTutorial) return;

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
        timestamp: detectedNote.timestamp || performance.now(),
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
        if (isTutorialSimulation && currentTutorialAction === "pause") {
          completeTutorialAction("pause");
        }
        if (nextPaused) {
          void audio.suspend();
        } else {
          void audio.resume();
        }
        setIsPlaying(!nextPaused);
        return nextPaused;
      });
    }
  }, [audio, completeTutorialAction, currentTutorialAction, gameState, isTutorialSimulation, startGame]);

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
  }, [activeNotes, gameState, isTutorialSimulation, startGame]);

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
  const completedTutorialActions = useMemo(
    () => ({
      ...tutorialActions,
      mic: Boolean(tutorialActions.mic || isMicActive),
    }),
    [isMicActive, tutorialActions],
  );

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
  }, [song?.duration]);

  const handleTutorialComplete = useCallback(() => {
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
  }, [song?.duration]);

  const handleTutorialStepChange = useCallback(
    (step: { requiredAction?: GameTutorialActionId }) => {
      if (!isTutorialSimulation) return;
      setCurrentTutorialAction(step.requiredAction ?? null);

      if (step.requiredAction === "speed") {
        resetTutorialSimulation({ speed: 0.45, playing: true });
      } else if (step.requiredAction === "waiting") {
        resetTutorialSimulation({ speed: 0.7, waiting: false, playing: true });
      } else if (step.requiredAction === "loop") {
        resetTutorialSimulation({ speed: 0.8, loop: false, playing: true });
      } else if (step.requiredAction === "keyboard") {
        resetTutorialSimulation({ speed: 0.7, waiting: true, playing: true });
      } else if (step.requiredAction === "pause") {
        resetTutorialSimulation({ speed: 0.75, playing: true });
      } else if (step.requiredAction === "restart") {
        setPlaybackSpeed(0.8);
        setIsWaitingMode(false);
        setIsLoopEnabled(false);
        resetTutorialSimulation({ speed: 0.8, playing: true });
      } else if (step.requiredAction === "mic" && isMicActive) {
        completeTutorialAction("mic");
      } else {
        setPlaybackSpeed((current) => (current < 0.5 ? 0.75 : current));
        setIsWaitingMode(false);
        setIsLoopEnabled(false);
        resetTutorialSimulation({ playing: false });
      }
    },
    [completeTutorialAction, isMicActive, isTutorialSimulation, resetTutorialSimulation],
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
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Música não encontrada</h1>
        <Link href="/dashboard/songs" className="text-cyan hover:underline">
          Voltar para a biblioteca
        </Link>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative flex min-h-screen flex-col overflow-hidden bg-black font-sans text-white">
      <OrientationOverlay />

      <GameTutorialOverlay
        open={showTutorial}
        onClose={handleTutorialClose}
        onComplete={handleTutorialComplete}
        onStepChange={handleTutorialStepChange}
        completedActions={completedTutorialActions}
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
          fallingNotes: fallingNotesTargetRef,
          hitLine: hitLineTargetRef,
          keyboard: keyboardTargetRef,
        }}
      />

      <div
        className="z-20 flex h-12 shrink-0 items-center gap-2 overflow-hidden border-b border-white/[0.06] px-2 md:px-5"
        style={{ background: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex min-w-0 shrink items-center gap-2">
          <Link href="/dashboard/songs" className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold leading-none">{song.title}</h1>
            <p className="mt-0.5 truncate text-[8px] uppercase tracking-widest text-white/35">{song.artist}</p>
          </div>
          <button
            ref={pauseShortcutRef}
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
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg border transition-all ${
              isPaused
                ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/8 hover:text-white"
            }`}
            title="Pausar ou continuar"
          >
            {isPaused ? <Play size={14} className="fill-amber-300" /> : <Pause size={14} />}
          </button>
        </div>

        <div
          data-testid="piano-top-controls"
          className="flex min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto overscroll-x-contain pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 md:justify-end md:gap-2 md:pr-0"
        >
          <button
            ref={volumeControlRef}
            onClick={() => {
              if (isTutorialSimulation) completeTutorialAction("volume");
              setAudioEnabled(!audioEnabled);
            }}
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
            onClick={() => {
              if (isTutorialSimulation) completeTutorialAction("mic");
              if (isTutorialSimulation && isMicActive) return;
              return isMicActive ? stopMic() : startMic();
            }}
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

          <button
            onClick={() => (midi.isConnected ? midi.disconnect() : void midi.connect())}
            disabled={!midi.isSupported}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
              midi.isConnected
                ? "border-cyan/30 bg-cyan/15 text-cyan"
                : midi.isSupported
                  ? "border-transparent text-white/30 hover:text-white/50"
                  : "cursor-not-allowed border-transparent text-white/15"
            }`}
            title={midi.error || (midi.isSupported ? "Conectar teclado MIDI" : "WebMIDI indisponivel neste navegador")}
          >
            <Cable size={13} />
            <span className="hidden md:inline">{midi.isConnected ? "MIDI ON" : "MIDI"}</span>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div
            className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 md:flex"
            title="Atalho de teclado para pausar"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Espaco</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">pausa</span>
          </div>

          <div className="hidden h-5 w-px bg-white/10 md:block" />

        <div className="flex items-center gap-1">
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase leading-none tracking-widest text-white/25">Resolução</p>
              <p className="mt-0.5 text-[10px] font-black leading-none text-white">Full HD</p>
            </div>
            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20">
              <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
            </div>
        </div>

          {isTutorialSimulation && currentTutorialAction === "keyboard" && (
            <div className="hidden rounded-lg border border-cyan/25 bg-cyan/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan md:block">
              Toque C4
            </div>
          )}

          {!isFreePlay && song.duration > 0 && (
            <>
              <div className="h-5 w-px bg-white/10" />

              <div ref={loopControlRef} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1">
                <button
                  data-testid="control-loop-toggle"
                  data-active={isLoopEnabled ? "true" : "false"}
                  onClick={() => {
                    if (isTutorialSimulation) completeTutorialAction("loop");
                    setIsLoopEnabled((current) => (isTutorialSimulation ? true : !current));
                    if (isTutorialSimulation) {
                      window.setTimeout(() => pauseTutorialSimulation(), 2200);
                    }
                  }}
                  className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
                    isLoopEnabled ? "bg-cyan/15 text-cyan" : "text-white/40 hover:text-white/70"
                  }`}
                  title="Ativar loop do trecho"
                >
                  Loop
                </button>
                <button
                  onClick={() => {
                    if (isTutorialSimulation) completeTutorialAction("loop");
                    handleSetLoopStart();
                  }}
                  className="rounded-lg bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/70 transition-colors hover:bg-white/15"
                  title="Marcar inicio do loop no ponto atual"
                >
                  A
                </button>
                <button
                  onClick={() => {
                    if (isTutorialSimulation) completeTutorialAction("loop");
                    handleSetLoopEnd();
                  }}
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
              data-testid="control-speed-down"
              onClick={() => {
                if (isTutorialSimulation) completeTutorialAction("speed");
                setPlaybackSpeed(Math.max(0.15, playbackSpeed - 0.05));
                if (isTutorialSimulation) {
                  window.setTimeout(() => pauseTutorialSimulation(), 1600);
                }
              }}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              -
            </button>
            <span data-testid="control-speed-value" className="min-w-[36px] text-center text-[10px] font-black text-cyan">{Math.round(playbackSpeed * 100)}%</span>
            <button
              data-testid="control-speed-up"
              onClick={() => {
                if (isTutorialSimulation) completeTutorialAction("speed");
                setPlaybackSpeed(Math.min(1.1, playbackSpeed + 0.05));
                if (isTutorialSimulation) {
                  window.setTimeout(() => pauseTutorialSimulation(), 1600);
                }
              }}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              +
            </button>
          </div>

          <div className="h-5 w-px bg-white/10" />

          <button
            ref={waitingControlRef}
            data-testid="control-waiting-toggle"
            data-active={isWaitingMode ? "true" : "false"}
            onClick={() => {
              if (isTutorialSimulation) completeTutorialAction("waiting");
              setIsWaitingMode(true);
            }}
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
            data-testid="control-metronome-down"
            onClick={() => {
              if (isTutorialSimulation) completeTutorialAction("metronome");
              setMetronomeVolume(Math.max(0, metronomeVolume - 0.02));
              if (isTutorialSimulation) {
                audio.playTick(Math.max(0.02, metronomeVolume - 0.02));
              }
            }}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              -
            </button>
            <span data-testid="control-metronome-value" className="min-w-[30px] text-center text-[10px] font-black text-white/60">
              {Math.round(metronomeVolume * 100)}%
            </span>
            <button
            data-testid="control-metronome-up"
            onClick={() => {
              if (isTutorialSimulation) completeTutorialAction("metronome");
              setMetronomeVolume(Math.min(0.5, metronomeVolume + 0.02));
              if (isTutorialSimulation) {
                audio.playTick(Math.min(0.5, metronomeVolume + 0.02));
              }
            }}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/8 text-xs font-bold text-white/60 transition-colors hover:bg-white/15"
            >
              +
            </button>
          </div>

          <div className="h-5 w-px bg-white/10" />

          <button
            ref={restartControlRef}
            data-testid="control-restart"
            onClick={() => {
              if (isTutorialSimulation) {
                completeTutorialAction("restart");
                resetTutorialSimulation();
                return;
              }
              restartGame();
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-white/30 transition-all hover:bg-rose-500/10 hover:text-rose-400"
            title="Reiniciar música"
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
                <h2 className="text-3xl font-black uppercase tracking-[8px] text-white">
                  {isLoopEnabled ? "Trecho preparado" : "Aperte uma tecla para comecar"}
                </h2>
                <p className="text-xs font-bold uppercase tracking-[4px] text-cyan/60">
                  {isLoopEnabled
                    ? `${formatLoopTime(loopStart)} - ${formatLoopTime(loopEnd)} em ${Math.round(playbackSpeed * 100)}%`
                    : "O estúdio está pronto e te esperando"}
                </p>
                {isLoopEnabled && (
                  <p className="max-w-md text-xs leading-relaxed text-white/45">
                    Loop e modo espera estão prontos para você repetir o trecho com calma.
                  </p>
                )}
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
                notes={playerNotes}
                difficulty={difficulty}
                activeNotes={activeNotes}
                isPlaying={isPlaying}
                isFreePlay={isTutorialSimulation}
                songDuration={playerDuration}
                getAudioTime={() => audio.getCurrentTime() - audioStartTime}
                metronomeVolume={metronomeVolume}
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
                  fallingNotesRef: fallingNotesTargetRef,
                  hitLineRef: hitLineTargetRef,
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
