"use client";

import { useRef, useEffect, useCallback, useMemo, type MutableRefObject } from "react";
import type { PracticeFeedbackSummary, SongNote } from "@/lib/types";
import { midiNoteToName, type MIDINote } from "@/hooks/useMIDI";
import type { Difficulty } from "@/lib/songFilters";
import { TIMING_WINDOWS } from "@/lib/songFilters";
import VirtualKeyboard from "./VirtualKeyboard";

interface PianoPlayerProps {
  notes: SongNote[];
  difficulty: Difficulty;
  activeNotes: Map<number, MIDINote>;
  isPlaying: boolean;
  getAudioTime: () => number;
  onScoreUpdate?: (score: number, combo: number, accuracy: number) => void;
  onSongEnd?: (summary: {
    score: number;
    combo: number;
    accuracy: number;
    elapsed: number;
    completed: boolean;
    feedback: PracticeFeedbackSummary;
  }) => void;
  onPracticeSuggestion?: (suggestion: { start: number; end: number; misses: number; message: string; mastered?: boolean }) => void;
  onNoteHit?: (midi: number, duration: number, velocity: number) => void;
  onNoteMiss?: (midi: number) => void;
  onPlayTick?: (velocity?: number) => void;
  onPlayNote?: (midi: number) => void;
  onReleaseNote?: (midi: number) => void;
  resumeAudio?: () => Promise<void>;
  startNote?: number;
  endNote?: number;
  isFreePlay?: boolean;
  songDuration?: number;
  isWaitingMode?: boolean;
  onPlayAccompaniment?: (midi: number, duration: number) => void;
  accompanimentNotes?: SongNote[];
  playbackSpeed?: number;
  initialPlaybackTime?: number;
  resetKey?: string | number;
  metronomeVolume?: number;
  loopRegion?: {
    enabled: boolean;
    start: number;
    end: number;
  };
  onProgressChange?: (time: number) => void;
  tutorialTargets?: {
    scoreRef?: MutableRefObject<HTMLDivElement | null>;
    comboRef?: MutableRefObject<HTMLDivElement | null>;
    accuracyRef?: MutableRefObject<HTMLDivElement | null>;
    progressRef?: MutableRefObject<HTMLDivElement | null>;
    fallingNotesRef?: MutableRefObject<HTMLDivElement | null>;
    hitLineRef?: MutableRefObject<HTMLDivElement | null>;
    keyboardRef?: MutableRefObject<HTMLDivElement | null>;
  };
}

interface VisualEffect {
  id: number;
  note: number;
  type: "hit" | "miss" | "perfect";
  startTime: number;
  sparked?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface NoteGroup {
  time: number;
  indices: number[];
}

const VIEWPORT_SECONDS = 4;
const CHORD_GROUP_WINDOW = 0.09;

const COLORS = {
  hitZoneLine: "rgba(125, 249, 255, 0.72)",
  grid: "rgba(255, 255, 255, 0.09)",
  gridHorizontal: "rgba(255, 255, 255, 0.055)",
  textFaded: "rgba(255, 255, 255, 0.22)",
  laneC: "rgba(125, 249, 255, 0.06)",
  laneBlack: "rgba(255, 255, 255, 0.035)",
};

const HAND_COLORS = {
  right: {
    top: "#FFF7C2",
    mid: "#FACC15",
    bottom: "#EA580C",
    edge: "rgba(254, 240, 138, 0.9)",
    glow: "rgba(250, 204, 21, 0.86)",
    active: "rgba(250, 204, 21, 0.38)",
    ink: "rgba(45, 30, 0, 0.96)",
    rail: "rgba(250, 204, 21, 0.12)",
  },
  left: {
    top: "#D9FFE8",
    mid: "#34D399",
    bottom: "#047857",
    edge: "rgba(167, 243, 208, 0.9)",
    glow: "rgba(52, 211, 153, 0.86)",
    active: "rgba(52, 211, 153, 0.38)",
    ink: "rgba(2, 38, 30, 0.96)",
    rail: "rgba(52, 211, 153, 0.12)",
  },
};

const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

function buildNoteGroups(notes: SongNote[]) {
  if (notes.length === 0) return [] as NoteGroup[];

  const sorted = notes
    .map((note, index) => ({ note, index }))
    .sort((a, b) => a.note.time - b.note.time || a.note.midi - b.note.midi);

  const groups: NoteGroup[] = [];

  for (const item of sorted) {
    const previous = groups[groups.length - 1];
    if (!previous || Math.abs(item.note.time - previous.time) > CHORD_GROUP_WINDOW) {
      groups.push({ time: item.note.time, indices: [item.index] });
      continue;
    }

    previous.indices.push(item.index);
  }

  return groups;
}

export default function PianoPlayer({
  notes,
  difficulty,
  activeNotes,
  isPlaying,
  getAudioTime,
  onScoreUpdate,
  onSongEnd,
  onNoteHit,
  onNoteMiss,
  onPlayTick,
  onPlayNote,
  onReleaseNote,
  resumeAudio,
  startNote = 36,
  endNote = 84,
  isFreePlay = false,
  songDuration = 0,
  isWaitingMode = false,
  onPlayAccompaniment,
  accompanimentNotes = [],
  playbackSpeed = 1,
  initialPlaybackTime = 0,
  resetKey,
  metronomeVolume = 0.08,
  loopRegion,
  onProgressChange,
  onPracticeSuggestion,
  tutorialTargets,
}: PianoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timingWindow = TIMING_WINDOWS[difficulty];
  const lastActiveNotesState = useRef("");
  const noteGroups = useMemo(() => buildNoteGroups(notes), [notes]);

  const stateRef = useRef({
    score: 0,
    combo: 0,
    hits: 0,
    misses: 0,
    wrongNotes: 0,
    perfectHits: 0,
    earlyHits: 0,
    lateHits: 0,
    maxCombo: 0,
    cleanLoopPasses: 0,
    wrongNoteTimes: new Set<string>(),
    missedNotesByMidi: new Map<number, number>(),
    loopMasteredRegions: new Set<string>(),
    timingDeltas: [] as number[],
    missesBySegment: new Map<number, number>(),
    suggestedSegments: new Set<number>(),
    gameTime: initialPlaybackTime,
    hitNotes: new Set<number>(),
    missedNotes: new Set<number>(),
    effects: [] as VisualEffect[],
    particles: [] as Particle[],
    effectId: 0,
    lastBeat: -1,
    internalGameTime: initialPlaybackTime,
    lastTickTime: 0,
    playedAccompaniment: new Set<number>(),
  });

  const scoreUIRef = useRef<HTMLParagraphElement>(null);
  const comboUIRef = useRef<HTMLParagraphElement>(null);
  const accuracyUIRef = useRef<HTMLParagraphElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const liveFeedbackRef = useRef<HTMLDivElement>(null);
  const lastProgressEmitRef = useRef(-1);

  const resetLoopWindowState = useCallback(
    (state: (typeof stateRef.current), start: number, end: number) => {
      const refreshedHits = new Set<number>();
      const refreshedMisses = new Set<number>();

      state.hitNotes.forEach((index) => {
        const note = notes[index];
        if (!note) return;
        if (note.time < start || note.time > end) refreshedHits.add(index);
      });

      state.missedNotes.forEach((index) => {
        const note = notes[index];
        if (!note) return;
        if (note.time < start || note.time > end) refreshedMisses.add(index);
      });

      state.hitNotes = refreshedHits;
      state.missedNotes = refreshedMisses;
      state.effects = [];

      if (state.playedAccompaniment.size > 0 && accompanimentNotes.length > 0) {
        const refreshedAccompaniment = new Set<number>();
        state.playedAccompaniment.forEach((index) => {
          const note = accompanimentNotes[index];
          if (!note) return;
          if (note.time < start || note.time > end) refreshedAccompaniment.add(index);
        });
        state.playedAccompaniment = refreshedAccompaniment;
      }

      const hits = refreshedHits.size;
      const misses = refreshedMisses.size;
      state.hits = hits;
      state.misses = misses;
      state.combo = 0;
    },
    [accompanimentNotes, notes],
  );

  const whiteNotes = useMemo(() => {
    const list: number[] = [];
    for (let midi = startNote; midi <= endNote; midi++) {
      if (!isBlackKey(midi)) list.push(midi);
    }
    return list;
  }, [startNote, endNote]);

  useEffect(() => {
    stateRef.current = {
      score: 0,
      combo: 0,
      hits: 0,
      misses: 0,
      wrongNotes: 0,
      perfectHits: 0,
      earlyHits: 0,
      lateHits: 0,
      maxCombo: 0,
      cleanLoopPasses: 0,
      wrongNoteTimes: new Set<string>(),
      missedNotesByMidi: new Map<number, number>(),
      loopMasteredRegions: new Set<string>(),
      timingDeltas: [],
      missesBySegment: new Map(),
      suggestedSegments: new Set(),
      gameTime: initialPlaybackTime,
      hitNotes: new Set(),
      missedNotes: new Set(),
      effects: [],
      particles: [],
      effectId: 0,
      lastBeat: -1,
      internalGameTime: initialPlaybackTime,
      lastTickTime: 0,
      playedAccompaniment: new Set(),
    };
    lastActiveNotesState.current = "";

    if (scoreUIRef.current) scoreUIRef.current.innerText = "0";
    if (comboUIRef.current) {
      comboUIRef.current.innerText = "0x";
      comboUIRef.current.className = "text-2xl md:text-4xl font-black tabular-nums relative z-10 transition-colors text-white/30";
    }
    if (accuracyUIRef.current) accuracyUIRef.current.innerText = "100%";
    lastProgressEmitRef.current = -1;
  }, [initialPlaybackTime, notes, resetKey]);

  const updateHUD = useCallback(() => {
    const state = stateRef.current;

    if (scoreUIRef.current) scoreUIRef.current.innerText = state.score.toLocaleString();

    if (comboUIRef.current) {
      comboUIRef.current.innerText = `${state.combo}x`;
      const isLegendary = state.combo >= 25;
      const isStreak = state.combo >= 10;
      comboUIRef.current.className = `text-2xl md:text-4xl font-black tabular-nums relative z-10 transition-colors ${
        isLegendary
          ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"
          : isStreak
          ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          : state.combo > 0
          ? "text-white"
          : "text-white/30"
      }`;
    }

    if (accuracyUIRef.current) {
      const total = state.hits + state.misses;
      const accuracy = total > 0 ? Math.round((state.hits / total) * 100) : 100;
      accuracyUIRef.current.innerText = `${accuracy}%`;
    }

    if (progressBarRef.current && songDuration > 0) {
      const progress = Math.min(100, (state.gameTime / songDuration) * 100);
      progressBarRef.current.style.width = `${progress}%`;
    }
  }, [songDuration]);

  const showLiveFeedback = useCallback((message: string, tone: "good" | "early" | "late" | "miss" | "coach") => {
    if (!liveFeedbackRef.current) return;
    const toneClass = {
      good: "border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
      early: "border-amber-300/30 bg-amber-400/15 text-amber-100",
      late: "border-cyan/30 bg-cyan/15 text-cyan",
      miss: "border-magenta/30 bg-magenta/15 text-pink-100",
      coach: "border-white/15 bg-white/10 text-white",
    }[tone];
    liveFeedbackRef.current.textContent = message;
    liveFeedbackRef.current.className = `pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] opacity-100 shadow-2xl backdrop-blur-md transition-all duration-200 ${toneClass}`;
    window.setTimeout(() => {
      if (!liveFeedbackRef.current) return;
      liveFeedbackRef.current.className = liveFeedbackRef.current.className.replace(" opacity-100", " opacity-0");
    }, 900);
  }, []);

  const buildFeedbackSummary = useCallback((): PracticeFeedbackSummary => {
    const state = stateRef.current;
    const totalNotes = state.hits + state.misses;
    const averageTimingMs =
      state.timingDeltas.length > 0
        ? Math.round((state.timingDeltas.reduce((sum, value) => sum + Math.abs(value), 0) / state.timingDeltas.length) * 1000)
        : 0;
    const weakestEntry = Array.from(state.missesBySegment.entries()).sort((a, b) => b[1] - a[1])[0];
    const weakestRange = weakestEntry
      ? {
          start: weakestEntry[0],
          end: weakestEntry[0] + 8,
          misses: weakestEntry[1],
        }
      : null;
    const problemNotes = Array.from(state.missedNotesByMidi.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([midi, misses]) => {
        const firstMatch = notes.find((note) => note.midi === midi);
        return {
          midi,
          name: midiNoteToName(midi),
          hand: firstMatch?.hand,
          time: firstMatch?.time ?? 0,
          misses,
        };
      });

    let recommendation = "Excelente consistencia. Continue aumentando o desafio aos poucos.";
    if (state.cleanLoopPasses >= 2) {
      recommendation = "Trecho dominado em repetições limpas. Aumente a velocidade aos poucos ou avance para a música completa.";
    } else if (state.wrongNotes >= 3) {
      recommendation = "Há notas inesperadas entrando na performance. Toque mais devagar e confira a mão indicada antes da linha de acerto.";
    } else if (problemNotes.length > 0 && problemNotes[0].misses >= 2) {
      recommendation = `A nota ${problemNotes[0].name ?? problemNotes[0].midi} apareceu como ponto fraco. Isole esse movimento por alguns ciclos.`;
    } else if (weakestRange && weakestRange.misses >= 3) {
      recommendation = `Treine o trecho ${Math.floor(weakestRange.start)}s-${Math.floor(weakestRange.end)}s em velocidade reduzida.`;
    } else if (state.lateHits > state.earlyHits && state.lateHits > 2) {
      recommendation = "Você está chegando um pouco tarde. Reduza a velocidade e antecipe a leitura das próximas notas.";
    } else if (state.earlyHits > state.lateHits && state.earlyHits > 2) {
      recommendation = "Você está tocando antes da linha. Respire com o pulso e deixe a nota encostar na zona de acerto.";
    } else if (state.misses > Math.max(2, totalNotes * 0.15)) {
      recommendation = "Ative o modo espera e pratique em blocos curtos até estabilizar a precisão.";
    }

    return {
      totalNotes,
      hits: state.hits,
      misses: state.misses,
      wrongNotes: state.wrongNotes,
      perfectHits: state.perfectHits,
      earlyHits: state.earlyHits,
      lateHits: state.lateHits,
      maxCombo: state.maxCombo,
      cleanLoopPasses: state.cleanLoopPasses,
      averageTimingMs,
      problemNotes,
      weakestRange,
      recommendation,
    };
  }, [notes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const resizeCanvas = () => {
      width = canvas.parentElement?.clientWidth || canvas.clientWidth;
      height = canvas.parentElement?.clientHeight || canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const getNoteRect = (midi: number, laneWidth: number) => {
      if (!isBlackKey(midi)) {
        const index = whiteNotes.indexOf(midi);
        return { x: index * laneWidth, w: laneWidth, isBlack: false };
      }

      const previousWhite = midi - 1;
      const index = whiteNotes.indexOf(previousWhite);
      const widthBlack = laneWidth * 0.55;
      const x = (index + 1) * laneWidth - widthBlack / 2;
      return { x, w: widthBlack, isBlack: true };
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const tick = () => {
      if (!isPlaying) {
        const idleGradient = ctx.createLinearGradient(0, 0, 0, height);
        idleGradient.addColorStop(0, "#030712");
        idleGradient.addColorStop(0.55, "#09090B");
        idleGradient.addColorStop(1, "#020617");
        ctx.fillStyle = idleGradient;
        ctx.fillRect(0, 0, width, height);
        const keyboardHeight = Math.round(height * 0.3);
        ctx.fillStyle = COLORS.hitZoneLine;
        ctx.fillRect(0, height - keyboardHeight, width, 1.5);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        return;
      }

      const state = stateRef.current;
      const laneWidth = width / whiteNotes.length;
      const keyboardHeight = Math.round(height * 0.3);
      const hitY = height - keyboardHeight;
      const speed = (height - keyboardHeight) / VIEWPORT_SECONDS;

      const nowMs = performance.now();
      if (state.lastTickTime === 0) state.lastTickTime = nowMs;
      const dt = (nowMs - state.lastTickTime) / 1000;
      state.lastTickTime = nowMs;

      const rawAudioTime = getAudioTime();
      if (state.internalGameTime === initialPlaybackTime && rawAudioTime < 0) {
        state.internalGameTime = Math.max(0, initialPlaybackTime + rawAudioTime);
      }

      const isWaiting = isWaitingMode && notes.some((note, index) => !state.hitNotes.has(index) && !state.missedNotes.has(index) && state.internalGameTime >= note.time);
      if (!isWaiting) state.internalGameTime += Math.min(dt * playbackSpeed, 2);

      const elapsed = state.internalGameTime;
      state.gameTime = elapsed;
      const roundedProgress = Math.max(0, Math.round(elapsed * 10) / 10);
      if (roundedProgress !== lastProgressEmitRef.current) {
        lastProgressEmitRef.current = roundedProgress;
        onProgressChange?.(roundedProgress);
      }

      if (loopRegion?.enabled && loopRegion.end > loopRegion.start && elapsed >= loopRegion.end) {
        const loopNotes = notes
          .map((note, index) => ({ note, index }))
          .filter(({ note }) => note.time >= loopRegion.start && note.time <= loopRegion.end);
        const loopHits = loopNotes.filter(({ index }) => state.hitNotes.has(index)).length;
        const loopMisses = loopNotes.filter(({ index }) => state.missedNotes.has(index)).length;
        const minimumCleanHits = Math.min(8, Math.max(1, loopNotes.length));
        if (loopNotes.length > 0 && loopMisses === 0 && loopHits >= minimumCleanHits) {
          state.cleanLoopPasses += 1;
        } else {
          state.cleanLoopPasses = 0;
        }

        const loopKey = `${Math.floor(loopRegion.start * 10)}-${Math.floor(loopRegion.end * 10)}`;
        if (state.cleanLoopPasses >= 2 && !state.loopMasteredRegions.has(loopKey)) {
          state.loopMasteredRegions.add(loopKey);
          onPracticeSuggestion?.({
            start: loopRegion.start,
            end: loopRegion.end,
            misses: 0,
            mastered: true,
            message: `Trecho dominado em ${state.cleanLoopPasses} repetições limpas. Você já pode subir a velocidade ou tocar a música completa.`,
          });
          showLiveFeedback("Trecho dominado", "good");
        }

        state.internalGameTime = loopRegion.start;
        state.gameTime = loopRegion.start;
        state.lastBeat = Math.floor(loopRegion.start / (60 / 120)) - 1;
        resetLoopWindowState(state, loopRegion.start, loopRegion.end);
        updateHUD();
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const bpm = 120;
      const secondsPerBeat = 60 / bpm;
      const currentBeat = Math.floor(elapsed / secondsPerBeat);

      if (currentBeat > state.lastBeat && elapsed >= 0) {
        state.lastBeat = currentBeat;
        const waitingNow = isWaitingMode && notes.some((note, index) => !state.hitNotes.has(index) && !state.missedNotes.has(index) && elapsed >= note.time);
        if (!waitingNow) onPlayTick?.(metronomeVolume);
      }

      const stageGradient = ctx.createLinearGradient(0, 0, 0, height);
      stageGradient.addColorStop(0, "#030712");
      stageGradient.addColorStop(0.36, "#07070A");
      stageGradient.addColorStop(0.72, "#111827");
      stageGradient.addColorStop(1, "#030712");
      ctx.fillStyle = stageGradient;
      ctx.fillRect(0, 0, width, height);

      const centerGlow = ctx.createRadialGradient(width / 2, hitY, 0, width / 2, hitY, Math.max(width, height) * 0.72);
      centerGlow.addColorStop(0, "rgba(34, 211, 238, 0.15)");
      centerGlow.addColorStop(0.34, "rgba(124, 58, 237, 0.08)");
      centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      const leftHandRail = ctx.createLinearGradient(0, 0, width * 0.44, 0);
      leftHandRail.addColorStop(0, HAND_COLORS.left.rail);
      leftHandRail.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = leftHandRail;
      ctx.fillRect(0, 0, width * 0.48, hitY);

      const rightHandRail = ctx.createLinearGradient(width, 0, width * 0.56, 0);
      rightHandRail.addColorStop(0, HAND_COLORS.right.rail);
      rightHandRail.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rightHandRail;
      ctx.fillRect(width * 0.52, 0, width * 0.48, hitY);

      whiteNotes.forEach((midi, index) => {
        const laneX = index * laneWidth;
        if (midi % 12 === 0) {
          ctx.fillStyle = COLORS.laneC;
          ctx.fillRect(laneX, 0, laneWidth, hitY);
        } else if (index % 2 === 0) {
          ctx.fillStyle = COLORS.laneBlack;
          ctx.fillRect(laneX, 0, laneWidth, hitY);
        }
      });

      ctx.lineWidth = 1;
      ctx.strokeStyle = COLORS.gridHorizontal;
      const beatSpacing = secondsPerBeat * speed;
      const firstBeatY = (elapsed % secondsPerBeat) * speed;
      ctx.beginPath();
      for (let y = firstBeatY; y < height; y += beatSpacing) {
        const beatAlpha = y < beatSpacing + 1 ? 0.1 : 0.055;
        ctx.strokeStyle = `rgba(255,255,255,${beatAlpha})`;
        ctx.moveTo(0, hitY - y);
        ctx.lineTo(width, hitY - y);
        ctx.moveTo(0, hitY + y);
        ctx.lineTo(width, hitY + y);
        ctx.stroke();
        ctx.beginPath();
      }

      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath();
      for (let i = 0; i <= whiteNotes.length; i++) {
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
      }
      ctx.stroke();

      const hitGradient = ctx.createLinearGradient(0, hitY - 54, 0, hitY + 20);
      hitGradient.addColorStop(0, "rgba(0,234,255,0)");
      hitGradient.addColorStop(0.58, "rgba(0,234,255,0.11)");
      hitGradient.addColorStop(1, "rgba(125,249,255,0.28)");
      ctx.fillStyle = hitGradient;
      ctx.fillRect(0, hitY - 54, width, 74);

      const pulse = 0.5 + Math.sin(nowMs / 220) * 0.5;
      ctx.fillStyle = `rgba(125,249,255,${0.44 + pulse * 0.24})`;
      ctx.shadowBlur = 22 + pulse * 18;
      ctx.shadowColor = "rgba(34,211,238,0.72)";
      ctx.fillRect(0, hitY - 1.25, width, 2.5);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(0, hitY + 4, width, 1);
      ctx.shadowBlur = 0;

      activeNotes.forEach((_value, midi) => {
        const rect = getNoteRect(midi, laneWidth);
        const isRightHand = midi >= 60;
        const hand = isRightHand ? HAND_COLORS.right : HAND_COLORS.left;
        const glow = ctx.createRadialGradient(rect.x + rect.w / 2, hitY, 0, rect.x + rect.w / 2, hitY, rect.w * 1.5);
        glow.addColorStop(0, hand.active);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(rect.x - rect.w, hitY - rect.w * 1.5, rect.w * 3, rect.w * 3);

        ctx.fillStyle = hand.edge;
        ctx.shadowBlur = 16;
        ctx.shadowColor = hand.glow;
        ctx.beginPath();
        ctx.roundRect(rect.x + rect.w * 0.18, hitY - 5, rect.w * 0.64, 10, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.font = "11px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.textFaded;
      whiteNotes.forEach((midi, index) => {
        ctx.fillText(midiNoteToName(midi).replace(/\d/, ""), index * laneWidth + laneWidth / 2, height - 8);
      });

      const missedSet = state.missedNotes;
      const hitSet = state.hitNotes;
      let missesAdded = false;

      noteGroups.forEach((group) => {
        const pendingIndices = group.indices.filter((index) => !hitSet.has(index) && !missedSet.has(index));
        if (pendingIndices.length === 0) return;
        if (elapsed <= group.time + timingWindow) return;

        state.combo = 0;
        missesAdded = true;

        pendingIndices.forEach((index) => {
          const note = notes[index];
          missedSet.add(index);
          state.misses += 1;
          state.missedNotesByMidi.set(note.midi, (state.missedNotesByMidi.get(note.midi) ?? 0) + 1);
          const segmentStart = Math.max(0, Math.floor(note.time / 8) * 8);
          const segmentMisses = (state.missesBySegment.get(segmentStart) ?? 0) + 1;
          state.missesBySegment.set(segmentStart, segmentMisses);
          if (segmentMisses >= 3 && !state.suggestedSegments.has(segmentStart)) {
            state.suggestedSegments.add(segmentStart);
            onPracticeSuggestion?.({
              start: segmentStart,
              end: Math.min(songDuration || segmentStart + 8, segmentStart + 8),
              misses: segmentMisses,
              message: `Trecho difícil detectado em ${Math.floor(segmentStart)}s-${Math.floor(segmentStart + 8)}s.`,
            });
            showLiveFeedback("Trecho difícil detectado", "coach");
          }
          onNoteMiss?.(note.midi);
          showLiveFeedback("Nota perdida", "miss");
          state.effects.push({
            id: state.effectId++,
            note: note.midi,
            type: "miss",
            startTime: rawAudioTime,
          });
        });
      });

      if (missesAdded) updateHUD();

      if (onPlayAccompaniment) {
        accompanimentNotes.forEach((note, index) => {
          if (!state.playedAccompaniment.has(index) && elapsed >= note.time) {
            state.playedAccompaniment.add(index);
            onPlayAccompaniment(note.midi, note.duration);
          }
        });
      }

      for (let index = 0; index < notes.length; index++) {
        const note = notes[index];
        const timeDiff = note.time - elapsed;
        const noteHeight = Math.max(note.duration * speed, 4);
        const yPos = hitY - timeDiff * speed - noteHeight;
        const noteEndTime = note.time + note.duration;
        if (yPos + noteHeight < -50 || (yPos > height + 50 && elapsed > noteEndTime + 0.3)) continue;

        const rect = getNoteRect(note.midi, laneWidth);
        const xPos = rect.isBlack ? rect.x : rect.x + rect.w * 0.1;
        const rectWidth = rect.isBlack ? rect.w : rect.w * 0.8;
        const isHit = hitSet.has(index);
        const isMiss = missedSet.has(index);
        const isRightHand = note.midi >= 60;
        const palette = isRightHand ? HAND_COLORS.right : HAND_COLORS.left;
        const noteCenterX = xPos + rectWidth / 2;
        const approach = Math.max(0, Math.min(1, 1 - Math.abs(timeDiff) / VIEWPORT_SECONDS));
        const sustainProgress =
          elapsed >= note.time && note.duration > 0
            ? Math.max(0, Math.min(1, (elapsed - note.time) / Math.max(note.duration, 0.001)))
            : 0;

        const drawY = yPos;
        let drawHeight = noteHeight;
        let alpha = 0.95;

        if (isHit && elapsed >= note.time) {
          const visibleBottom = Math.min(yPos + noteHeight, hitY);
          drawHeight = Math.max(0, visibleBottom - yPos);
          alpha = elapsed <= noteEndTime ? 0.98 : Math.max(0, 1 - (elapsed - noteEndTime) * 3);
        } else if (isMiss) {
          alpha = Math.max(0, 0.48 - (elapsed - note.time) * 1.2);
        } else {
          alpha = 0.68 + approach * 0.28;
        }

        if (drawHeight <= 1 || alpha <= 0) continue;

        ctx.globalAlpha = alpha;
        if (!isHit && !isMiss && timeDiff > 0 && timeDiff < 1.2) {
          const landingAlpha = Math.max(0, 1 - timeDiff / 1.2) * 0.34;
          const landingGradient = ctx.createRadialGradient(noteCenterX, hitY, 0, noteCenterX, hitY, rectWidth * 1.4);
          landingGradient.addColorStop(0, palette.glow.replace("0.86", `${landingAlpha}`));
          landingGradient.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = landingGradient;
          ctx.fillRect(noteCenterX - rectWidth * 1.8, hitY - rectWidth * 1.8, rectWidth * 3.6, rectWidth * 3.6);
        }

        const gradient = ctx.createLinearGradient(xPos, drawY, xPos, drawY + drawHeight);
        gradient.addColorStop(0, isHit ? "#FFFFFF" : palette.top);
        gradient.addColorStop(0.18, isHit ? palette.top : palette.mid);
        gradient.addColorStop(0.52, palette.mid);
        gradient.addColorStop(1, rect.isBlack ? palette.bottom : palette.bottom);

        const outerGlowAlpha = isHit ? 0.92 : 0.46 + approach * 0.28;
        ctx.fillStyle = gradient;
        ctx.strokeStyle = isHit ? "rgba(255,255,255,0.95)" : palette.edge;
        ctx.lineWidth = rect.isBlack ? 2.2 : 1.8;
        ctx.shadowBlur = isHit ? 30 : rect.isBlack ? 20 : 16;
        ctx.shadowColor = palette.glow;

        ctx.beginPath();
        ctx.roundRect(xPos, drawY, rectWidth, drawHeight, rect.isBlack ? 6 : 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = alpha * outerGlowAlpha;
        ctx.strokeStyle = isRightHand ? "rgba(255,255,255,0.36)" : "rgba(236,253,245,0.34)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(xPos + 2, drawY + 2, Math.max(1, rectWidth - 4), Math.max(1, drawHeight - 4), rect.isBlack ? 5 : 9);
        ctx.stroke();
        ctx.globalAlpha = alpha;

        const topCap = ctx.createLinearGradient(xPos, drawY, xPos, drawY + Math.min(26, drawHeight));
        topCap.addColorStop(0, "rgba(255,255,255,0.58)");
        topCap.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = topCap;
        ctx.beginPath();
        ctx.roundRect(xPos + 2, drawY + 2, Math.max(1, rectWidth - 4), Math.min(24, Math.max(2, drawHeight - 4)), rect.isBlack ? 5 : 9);
        ctx.fill();

        const shine = ctx.createLinearGradient(xPos, drawY, xPos + rectWidth, drawY);
        shine.addColorStop(0, "rgba(255,255,255,0)");
        shine.addColorStop(0.18, "rgba(255,255,255,0.42)");
        shine.addColorStop(0.38, "rgba(255,255,255,0.06)");
        shine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.roundRect(xPos + rectWidth * 0.1, drawY + 2, Math.max(2, rectWidth * 0.24), Math.max(2, drawHeight - 4), rect.isBlack ? 4 : 7);
        ctx.fill();

        if (isHit && elapsed >= note.time && elapsed <= noteEndTime && drawHeight > 10) {
          const drainHeight = Math.max(2, drawHeight * sustainProgress);
          const drainY = Math.max(drawY, hitY - drainHeight);
          const drainGradient = ctx.createLinearGradient(0, drainY, 0, drainY + drainHeight);
          drainGradient.addColorStop(0, "rgba(255,255,255,0.18)");
          drainGradient.addColorStop(1, "rgba(255,255,255,0.42)");
          ctx.fillStyle = drainGradient;
          ctx.beginPath();
          ctx.roundRect(xPos, drainY, rectWidth, drainHeight, rect.isBlack ? 5 : 8);
          ctx.fill();

          ctx.fillStyle = "rgba(255,255,255,0.68)";
          ctx.fillRect(xPos + 3, drainY, Math.max(1, rectWidth - 6), 2);
        } else if (!isHit && !isMiss && note.duration > 1 && drawHeight > 34) {
          const holdGuideY = Math.max(drawY + 10, drawY + drawHeight - Math.min(18, drawHeight * 0.18));
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.fillRect(xPos + rectWidth * 0.18, holdGuideY, rectWidth * 0.64, 2);
        }

        if (drawHeight >= 12 && rectWidth >= 10) {
          ctx.fillStyle = rect.isBlack ? "rgba(255,255,255,0.92)" : palette.ink;
          const compactLabel = drawHeight < 24;
          ctx.font = `900 ${compactLabel ? 10 : rect.isBlack ? 11 : 13}px var(--font-geist-mono), monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const label = midiNoteToName(note.midi);
          ctx.fillText(compactLabel ? label.replace(/\d/g, "") : label, xPos + rectWidth / 2, drawY + drawHeight / 2);
        }
      }

      ctx.globalAlpha = 1;

      const activeEffects: VisualEffect[] = [];
      for (const effect of state.effects) {
        const age = rawAudioTime - effect.startTime;
        if (age > 0.6) continue;

        activeEffects.push(effect);
        const isMiss = effect.type === "miss";
        const isPerfect = effect.type === "perfect";

        if (!effect.sparked && !isMiss) {
          effect.sparked = true;
          const rect = getNoteRect(effect.note, laneWidth);
          const isRightHand = effect.note >= 60;
          const particleCount = isPerfect ? 24 : 14;
          const colors = isRightHand
            ? ["#FACC15", "#FDE68A", "#F59E0B", "#FFFFFF"]
            : ["#4ADE80", "#86EFAC", "#10B981", "#FFFFFF"];

          for (let i = 0; i < particleCount; i++) {
            state.particles.push({
              x: rect.x + rect.w / 2 + (Math.random() - 0.5) * rect.w,
              y: hitY,
              vx: (Math.random() - 0.5) * 10,
              vy: -Math.random() * 8 - 2,
              life: Math.random() * 0.4 + 0.2,
              maxLife: 0.6,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 3 + 1.5,
            });
          }
        }

        const scale = Math.min(age * 4, 1);
        const opacity = Math.max(0, 1 - age * 1.5);
        const rect = getNoteRect(effect.note, laneWidth);
        const baseX = rect.x + rect.w / 2;
        const baseY = hitY - age * 80;
        const effectPalette = effect.note >= 60 ? HAND_COLORS.right : HAND_COLORS.left;

        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isMiss ? "rgba(255,0,229,0.7)" : effectPalette.edge;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 18;
        ctx.shadowColor = isMiss ? "rgba(255,0,229,0.8)" : effectPalette.glow;
        ctx.beginPath();
        ctx.arc(baseX, hitY, rect.w * (0.24 + age * 1.4), 0, Math.PI * 2);
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${isPerfect ? 11 + scale * 6 : 14 + scale * 10}px var(--font-geist-mono), monospace`;
        if (isPerfect) {
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = effectPalette.glow;
          ctx.fillText("★", baseX, baseY);
        } else if (isMiss) {
          ctx.fillStyle = "#FF00E5";
          ctx.shadowColor = "rgba(255,0,229,0.8)";
          ctx.fillText("✕", baseX, baseY);
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = effectPalette.glow;
          ctx.fillText("✓", baseX, baseY);
        }
      }
      state.effects = activeEffects;

      const activeParticles: Particle[] = [];
      for (const particle of state.particles) {
        particle.life -= 1 / 60;
        if (particle.life <= 0) continue;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.25;

        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        activeParticles.push(particle);
      }
      state.particles = activeParticles;

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (!isFreePlay) {
        const lastNote = notes[notes.length - 1];
        if (lastNote && elapsed > lastNote.time + lastNote.duration + 2) {
          const total = state.hits + state.misses;
          const accuracy = total > 0 ? (state.hits / total) * 100 : 100;
          onScoreUpdate?.(state.score, state.combo, accuracy);
          onSongEnd?.({
            score: state.score,
            combo: state.maxCombo,
            accuracy,
            elapsed: Math.max(0, elapsed),
            completed: true,
            feedback: buildFeedbackSummary(),
          });
          return;
        }
      }

      if (progressBarRef.current && songDuration > 0) {
        const progress = Math.min(100, (elapsed / songDuration) * 100);
        progressBarRef.current.style.left = `calc(${progress}% - 12px)`;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isPlaying,
    getAudioTime,
    initialPlaybackTime,
    notes,
    noteGroups,
    timingWindow,
    updateHUD,
    startNote,
    endNote,
    isFreePlay,
    whiteNotes,
    onPlayTick,
    songDuration,
    isWaitingMode,
    accompanimentNotes,
    onPlayAccompaniment,
    playbackSpeed,
    metronomeVolume,
    activeNotes,
    loopRegion,
    onNoteMiss,
    onProgressChange,
    onScoreUpdate,
    onSongEnd,
    onPracticeSuggestion,
    resetLoopWindowState,
    buildFeedbackSummary,
    showLiveFeedback,
  ]);

  useEffect(() => {
    if (!isPlaying) return;

    const activeStateHash = Array.from(activeNotes.entries())
      .map(([midi, note]) => `${midi}-${note.velocity}`)
      .join("|");

    if (activeStateHash === lastActiveNotesState.current) return;
    lastActiveNotesState.current = activeStateHash;

    const state = stateRef.current;
    let uiChanged = false;
    const eventTime = getAudioTime();

    if (isFreePlay) {
      activeNotes.forEach((midiNote) => {
        const alreadyRegistered = state.effects.some((effect) => effect.note === midiNote.note && eventTime - effect.startTime < 0.1);
        if (alreadyRegistered) return;

        state.score += 10;
        uiChanged = true;
        state.effects.push({
          id: state.effectId++,
          note: midiNote.note,
          type: "perfect",
          startTime: eventTime,
        });
        onNoteHit?.(midiNote.note, 0.5, midiNote.velocity ?? 0.8);
      });
    } else {
      const playedNotes = new Set(activeNotes.keys());
      const candidateGroups = noteGroups
        .filter((group) => Math.abs(state.gameTime - group.time) <= timingWindow)
        .filter((group) => group.indices.some((index) => !state.hitNotes.has(index) && !state.missedNotes.has(index)))
        .sort((a, b) => {
          const delta = Math.abs(state.gameTime - a.time) - Math.abs(state.gameTime - b.time);
          if (delta !== 0) return delta;
          return b.indices.length - a.indices.length;
        });
      const expectedMidis = new Set<number>();
      candidateGroups.forEach((group) => {
        group.indices.forEach((index) => {
          if (!state.hitNotes.has(index) && !state.missedNotes.has(index)) {
            expectedMidis.add(notes[index].midi);
          }
        });
      });

      if (expectedMidis.size > 0) {
        playedNotes.forEach((midi) => {
          if (expectedMidis.has(midi)) return;
          const eventBucket = Math.floor(state.gameTime * 4);
          const wrongKey = `${midi}-${eventBucket}`;
          if (state.wrongNoteTimes.has(wrongKey)) return;

          state.wrongNoteTimes.add(wrongKey);
          state.wrongNotes += 1;
          state.combo = 0;
          uiChanged = true;
          state.effects.push({
            id: state.effectId++,
            note: midi,
            type: "miss",
            startTime: eventTime,
          });
          showLiveFeedback(`Nota inesperada: ${midiNoteToName(midi)}`, "miss");
        });
      }

      for (const group of candidateGroups) {
        const pendingIndices = group.indices.filter((index) => !state.hitNotes.has(index) && !state.missedNotes.has(index));
        if (pendingIndices.length === 0) continue;

        const allNotesPresent = pendingIndices.every((index) => playedNotes.has(notes[index].midi));
        if (!allNotesPresent) continue;

        pendingIndices.forEach((index) => {
          const note = notes[index];
          state.hitNotes.add(index);
          state.combo += 1;
          state.maxCombo = Math.max(state.maxCombo, state.combo);
          state.hits += 1;
          const timingDelta = state.gameTime - group.time;
          state.timingDeltas.push(timingDelta);
          if (Math.abs(timingDelta) <= timingWindow * 0.35) {
            state.perfectHits += 1;
            showLiveFeedback("Perfeito", "good");
          } else if (timingDelta < 0) {
            state.earlyHits += 1;
            showLiveFeedback("Cedo", "early");
          } else {
            state.lateHits += 1;
            showLiveFeedback("Tarde", "late");
          }
          const comboMultiplier = Math.floor(state.combo / 5) + 1;
          state.score += 100 * comboMultiplier;
          uiChanged = true;

          state.effects.push({
            id: state.effectId++,
            note: note.midi,
            type: state.combo >= 10 ? "perfect" : "hit",
            startTime: eventTime,
          });

          onNoteHit?.(note.midi, note.duration, note.velocity ?? 0.8);
        });
      }
    }

    if (uiChanged) updateHUD();
  }, [activeNotes, getAudioTime, isFreePlay, isPlaying, noteGroups, notes, onNoteHit, showLiveFeedback, timingWindow, updateHUD]);

  return (
    <div className="relative w-full flex-1 overflow-hidden rounded-3xl border border-cyan/15 bg-zinc-950 shadow-[0_28px_90px_rgba(0,0,0,0.6),0_0_42px_rgba(34,211,238,0.08)]">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_68%,rgba(34,211,238,0.10),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.76),transparent_24%,rgba(0,0,0,0.64))]" />

      {!isFreePlay && songDuration > 0 && (
        <div
          ref={tutorialTargets?.progressRef}
          data-testid="piano-progress"
          className="absolute left-1/2 top-4 z-40 flex h-6 w-[80%] max-w-2xl -translate-x-1/2 items-center overflow-hidden rounded-full border border-cyan/15 bg-black/55 px-1 shadow-[0_12px_34px_rgba(0,0,0,0.35),0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md"
        >
          <div className="pointer-events-none absolute inset-0 flex justify-between px-4 opacity-20">
            {Array.from({ length: 40 }).map((_, index) => (
              <div key={index} className={`self-center bg-white ${index % 5 === 0 ? "h-3 w-[1px]" : "h-1.5 w-[1px]"}`} />
            ))}
          </div>

          <div className="relative h-full w-full">
            <div
              ref={progressBarRef}
              className="absolute top-1/2 h-3 w-7 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan via-white to-magenta shadow-[0_0_16px_rgba(34,211,238,0.8)] transition-[left] duration-300 ease-linear"
              style={{ left: "0%" }}
            />
          </div>
        </div>
      )}

      <div
        ref={liveFeedbackRef}
        className="pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white opacity-0 shadow-2xl backdrop-blur-md transition-all duration-200"
      />

      <div className="absolute inset-0 z-10 overflow-hidden">
        <div className="relative h-full w-full">
          <div
            ref={tutorialTargets?.fallingNotesRef}
            className="pointer-events-none absolute left-4 right-4 top-14 z-20"
            style={{ height: "calc(70% - 72px)" }}
          />
          <div
            ref={tutorialTargets?.hitLineRef}
            className="pointer-events-none absolute left-0 right-0 z-20 h-4 -translate-y-1/2"
            style={{ top: "70%" }}
          />
          <canvas ref={canvasRef} data-testid="piano-canvas" className="pointer-events-none absolute inset-0 block h-full w-full" />
          <div
            ref={tutorialTargets?.keyboardRef}
            data-testid="piano-keyboard"
            className="pointer-events-auto absolute bottom-0 left-0 right-0"
            style={{ height: "30%" }}
          >
            <VirtualKeyboard
              onPlayNote={(midi) => {
                resumeAudio?.();
                onPlayNote?.(midi);
              }}
              onReleaseNote={onReleaseNote || (() => {})}
              activeNotes={activeNotes as unknown as Map<number, boolean>}
              startNote={startNote}
              endNote={endNote}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex items-center justify-between md:left-6 md:right-6 md:top-6">
        <div ref={tutorialTargets?.scoreRef} data-testid="piano-hud-score" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md md:rounded-2xl md:px-5 md:py-3">
          <p className="mb-0 text-[8px] font-bold uppercase tracking-widest text-white/40 md:mb-1 md:text-[10px]">Pontos</p>
          <p ref={scoreUIRef} className="text-gradient text-lg font-black tabular-nums md:text-2xl">
            0
          </p>
        </div>

        <div
          ref={tutorialTargets?.comboRef}
          data-testid="piano-hud-combo"
          className="min-w-[100px] rounded-xl border border-cyan/15 bg-black/40 px-5 py-2 text-center shadow-[0_18px_48px_rgba(0,0,0,0.42),0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md md:min-w-[130px] md:rounded-2xl md:px-8 md:py-4"
        >
          <p className="mb-0 text-[9px] font-black uppercase tracking-[3px] text-white/40 md:mb-1 md:text-xs">Combos</p>
          <p ref={comboUIRef} className="text-2xl font-black tabular-nums text-white/30 md:text-4xl">
            0x
          </p>
        </div>

        <div
          ref={tutorialTargets?.accuracyRef}
          data-testid="piano-hud-accuracy"
          className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-right shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md md:rounded-2xl md:px-5 md:py-3"
        >
          <p className="mb-0 text-[8px] font-bold uppercase tracking-widest text-white/40 md:mb-1 md:text-[10px]">Precisão</p>
          <p ref={accuracyUIRef} className="text-lg font-black tabular-nums text-white md:text-2xl">
            100%
          </p>
        </div>
      </div>
    </div>
  );
}
