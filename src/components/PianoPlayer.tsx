"use client";

import { useRef, useEffect, useCallback, useMemo, type MutableRefObject } from "react";
import type { SongNote } from "@/lib/songs";
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
  onSongEnd?: () => void;
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
  hitZoneLine: "rgba(255, 255, 255, 0.3)",
  grid: "rgba(255, 255, 255, 0.12)",
  gridHorizontal: "rgba(255, 255, 255, 0.06)",
  textFaded: "rgba(255, 255, 255, 0.15)",
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
  metronomeVolume = 0.08,
  loopRegion,
  onProgressChange,
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
    gameTime: 0,
    hitNotes: new Set<number>(),
    missedNotes: new Set<number>(),
    effects: [] as VisualEffect[],
    particles: [] as Particle[],
    effectId: 0,
    lastBeat: -1,
    internalGameTime: 0,
    lastTickTime: 0,
    playedAccompaniment: new Set<number>(),
  });

  const scoreUIRef = useRef<HTMLParagraphElement>(null);
  const comboUIRef = useRef<HTMLParagraphElement>(null);
  const accuracyUIRef = useRef<HTMLParagraphElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
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
      gameTime: 0,
      hitNotes: new Set(),
      missedNotes: new Set(),
      effects: [],
      particles: [],
      effectId: 0,
      lastBeat: -1,
      internalGameTime: 0,
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
  }, [notes]);

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
        ctx.fillStyle = "#0A0A0A";
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
      if (state.internalGameTime === 0 && rawAudioTime < 0) {
        state.internalGameTime = rawAudioTime;
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

      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = COLORS.gridHorizontal;
      const beatSpacing = secondsPerBeat * speed;
      const firstBeatY = (elapsed % secondsPerBeat) * speed;
      ctx.beginPath();
      for (let y = firstBeatY; y < height; y += beatSpacing) {
        ctx.moveTo(0, hitY - y);
        ctx.lineTo(width, hitY - y);
        ctx.moveTo(0, hitY + y);
        ctx.lineTo(width, hitY + y);
      }
      ctx.stroke();

      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath();
      for (let i = 0; i <= whiteNotes.length; i++) {
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
      }
      ctx.stroke();

      const hitGradient = ctx.createLinearGradient(0, hitY - 40, 0, hitY);
      hitGradient.addColorStop(0, "rgba(0,234,255,0)");
      hitGradient.addColorStop(1, "rgba(0,234,255,0.1)");
      ctx.fillStyle = hitGradient;
      ctx.fillRect(0, hitY - 40, width, 40);

      activeNotes.forEach((_value, midi) => {
        const rect = getNoteRect(midi, laneWidth);
        const isRightHand = midi >= 60;
        const glow = ctx.createRadialGradient(rect.x + rect.w / 2, hitY, 0, rect.x + rect.w / 2, hitY, rect.w * 1.5);
        if (isRightHand) {
          glow.addColorStop(0, "rgba(234, 179, 8, 0.35)");
          glow.addColorStop(1, "rgba(234, 179, 8, 0)");
        } else {
          glow.addColorStop(0, "rgba(34, 197, 94, 0.35)");
          glow.addColorStop(1, "rgba(34, 197, 94, 0)");
        }
        ctx.fillStyle = glow;
        ctx.fillRect(rect.x - rect.w, hitY - rect.w * 1.5, rect.w * 3, rect.w * 3);
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
          onNoteMiss?.(note.midi);
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
        if (yPos + noteHeight < -50 || yPos > height + 50) continue;

        const rect = getNoteRect(note.midi, laneWidth);
        const xPos = rect.isBlack ? rect.x : rect.x + rect.w * 0.1;
        const rectWidth = rect.isBlack ? rect.w : rect.w * 0.8;
        const isHit = hitSet.has(index);
        const isMiss = missedSet.has(index);
        const isRightHand = note.midi >= 60;

        let alpha = 0.9;
        if (isHit) alpha = Math.max(0, 1 - (elapsed - note.time) * 4);
        else if (isMiss) alpha = Math.max(0, 0.5 - (elapsed - note.time));
        if (alpha <= 0) continue;

        ctx.globalAlpha = alpha;
        const gradient = ctx.createLinearGradient(xPos, yPos, xPos, yPos + noteHeight);
        if (rect.isBlack) {
          if (isRightHand) {
            gradient.addColorStop(0, "#F59E0B");
            gradient.addColorStop(1, "#B45309");
          } else {
            gradient.addColorStop(0, "#059669");
            gradient.addColorStop(1, "#065F46");
          }
        } else {
          if (isRightHand) {
            gradient.addColorStop(0, "#FEF08A");
            gradient.addColorStop(1, "#EAB308");
          } else {
            gradient.addColorStop(0, "#BBF7D0");
            gradient.addColorStop(1, "#16A34A");
          }
        }

        ctx.fillStyle = isHit ? "#FFFFFF" : gradient;
        ctx.strokeStyle = isHit ? "#FFFFFF" : rect.isBlack ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)";
        ctx.lineWidth = rect.isBlack ? 2 : 1.5;
        ctx.shadowBlur = isHit ? 25 : rect.isBlack ? 14 : 10;
        ctx.shadowColor = isRightHand
          ? rect.isBlack
            ? "rgba(245, 158, 11, 0.8)"
            : "rgba(234, 179, 8, 0.6)"
          : rect.isBlack
          ? "rgba(5, 150, 105, 0.8)"
          : "rgba(34, 197, 94, 0.6)";

        ctx.beginPath();
        ctx.roundRect(xPos, yPos, rectWidth, noteHeight, rect.isBlack ? 4 : 6);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (noteHeight > 25) {
          ctx.fillStyle = rect.isBlack ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
          ctx.font = `bold ${rect.isBlack ? 11 : 13}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(midiNoteToName(note.midi), xPos + rectWidth / 2, yPos + noteHeight - 12);
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

        ctx.globalAlpha = opacity;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${16 + scale * 14}px sans-serif`;
        ctx.shadowBlur = 15;
        if (isPerfect) {
          ctx.fillStyle = "#34D399";
          ctx.shadowColor = "rgba(52,211,153,0.8)";
          ctx.fillText("★", baseX, baseY);
        } else if (isMiss) {
          ctx.fillStyle = "#FF00E5";
          ctx.shadowColor = "rgba(255,0,229,0.8)";
          ctx.fillText("✕", baseX, baseY);
        } else {
          ctx.fillStyle = "#34D399";
          ctx.shadowColor = "rgba(52,211,153,0.5)";
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
          onSongEnd?.();
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
    resetLoopWindowState,
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

      for (const group of candidateGroups) {
        const pendingIndices = group.indices.filter((index) => !state.hitNotes.has(index) && !state.missedNotes.has(index));
        if (pendingIndices.length === 0) continue;

        const allNotesPresent = pendingIndices.every((index) => playedNotes.has(notes[index].midi));
        if (!allNotesPresent) continue;

        pendingIndices.forEach((index) => {
          const note = notes[index];
          state.hitNotes.add(index);
          state.combo += 1;
          state.hits += 1;
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
  }, [activeNotes, getAudioTime, isFreePlay, isPlaying, noteGroups, notes, onNoteHit, timingWindow, updateHUD]);

  return (
    <div className="relative w-full flex-1 overflow-hidden rounded-3xl border border-white/[0.1] bg-zinc-950 shadow-2xl">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/60" />

      {!isFreePlay && songDuration > 0 && (
        <div
          ref={tutorialTargets?.progressRef}
          className="absolute left-1/2 top-4 z-40 flex h-6 w-[80%] max-w-2xl -translate-x-1/2 items-center overflow-hidden rounded-full border border-white/10 bg-zinc-900/80 px-1 backdrop-blur-md"
        >
          <div className="pointer-events-none absolute inset-0 flex justify-between px-4 opacity-20">
            {Array.from({ length: 40 }).map((_, index) => (
              <div key={index} className={`self-center bg-white ${index % 5 === 0 ? "h-3 w-[1px]" : "h-1.5 w-[1px]"}`} />
            ))}
          </div>

          <div className="relative h-full w-full">
            <div
              ref={progressBarRef}
              className="absolute top-1/2 h-3 w-6 -translate-y-1/2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] transition-[left] duration-300 ease-linear"
              style={{ left: "0%" }}
            />
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-10 overflow-hidden">
        <div className="relative h-full w-full">
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block h-full w-full" />
          <div
            ref={tutorialTargets?.keyboardRef}
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
        <div ref={tutorialTargets?.scoreRef} className="glass rounded-xl border border-white/10 px-3 py-2 shadow-lg md:rounded-2xl md:px-5 md:py-3">
          <p className="mb-0 text-[8px] font-bold uppercase tracking-widest text-white/40 md:mb-1 md:text-[10px]">Pontos</p>
          <p ref={scoreUIRef} className="text-gradient text-lg font-black tabular-nums md:text-2xl">
            0
          </p>
        </div>

        <div
          ref={tutorialTargets?.comboRef}
          className="glass min-w-[100px] rounded-xl border border-white/10 px-5 py-2 text-center shadow-lg md:min-w-[130px] md:rounded-2xl md:px-8 md:py-4"
        >
          <p className="mb-0 text-[9px] font-black uppercase tracking-[3px] text-white/40 md:mb-1 md:text-xs">Combos</p>
          <p ref={comboUIRef} className="text-2xl font-black tabular-nums text-white/30 md:text-4xl">
            0x
          </p>
        </div>

        <div
          ref={tutorialTargets?.accuracyRef}
          className="glass rounded-xl border border-white/10 px-3 py-2 text-right shadow-lg md:rounded-2xl md:px-5 md:py-3"
        >
          <p className="mb-0 text-[8px] font-bold uppercase tracking-widest text-white/40 md:mb-1 md:text-[10px]">Precisao</p>
          <p ref={accuracyUIRef} className="text-lg font-black tabular-nums text-white md:text-2xl">
            100%
          </p>
        </div>
      </div>
    </div>
  );
}
