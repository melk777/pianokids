"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import type { SongNote } from "@/lib/songs";
import { midiNoteToName, type MIDINote } from "@/hooks/useMIDI";
import type { Difficulty } from "@/lib/songFilters";
import { TIMING_WINDOWS } from "@/lib/songFilters";
import VirtualKeyboard from "./VirtualKeyboard";

/* ── Types ───────────────────────────────────────────── */

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
}


/* ── Constants ───────────────────────────────────────── */

const VIEWPORT_SECONDS = 4;


/* ── Colors (Dark Mode, Clean & Bright) ───────────── */

const COLORS = {
  rightHandFill: "rgba(0, 234, 255, 0.55)",
  rightHandStroke: "#00EAFF",
  leftHandFill: "rgba(16, 185, 129, 0.55)",
  leftHandStroke: "#10B981",

  hitNormal: "rgba(255, 255, 255, 0.7)",
  hitStroke: "#FFFFFF",

  comboGlow: "rgba(252, 211, 77, 0.8)",
  missedFill: "rgba(255, 0, 229, 0.3)",
  missedStroke: "#FF00E5",

  hitZoneLine: "rgba(255, 255, 255, 0.3)",
  grid: "rgba(255, 255, 255, 0.12)",
  gridHorizontal: "rgba(255, 255, 255, 0.06)",
  textDim: "rgba(255, 255, 255, 0.65)",
  textFaded: "rgba(255, 255, 255, 0.15)",
};

/* ── Functions ───────────────────────────────────────── */
const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

/* ── Visual Effect Interface ── */
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

/* ── Component ───────────────────────────────────────── */

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
  startNote = 48,
  endNote = 77,
  isFreePlay = false,
  songDuration = 0,
  isWaitingMode = false,
  onPlayAccompaniment,
  accompanimentNotes = [],
  playbackSpeed = 1.0,
  metronomeVolume = 0.08,
}: PianoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core Game State (Refs — NO React State so NO re-renders during gameplay!)
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

  const animFrameRef = useRef<number>(0);
  const timingWindow = TIMING_WINDOWS[difficulty];
  const lastActiveNotesState = useRef<string>("");

  // Refs para os elementos de HUD (atualização fora do React DOM Tree)
  const scoreUIRef = useRef<HTMLParagraphElement>(null);
  const comboUIRef = useRef<HTMLParagraphElement>(null);
  const accuracyUIRef = useRef<HTMLParagraphElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Memoize whiteNotes and totalWidth for both Canvas and JSX
  const whiteNotes = useMemo(() => {
    const list: number[] = [];
    for (let i = startNote; i <= endNote; i++) {
      if (!isBlackKey(i)) list.push(i);
    }
    return list;
  }, [startNote, endNote]);

  const totalWidth = whiteNotes.length * 60;

  // Initialize/Reset State
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
  }, [notes]);

  // Função auxiliar para atualizar as pontuações na DOM
  const updateHUD = useCallback(() => {
    const s = stateRef.current;
    
    if (scoreUIRef.current) {
      scoreUIRef.current.innerText = s.score.toLocaleString();
    }
    
    if (comboUIRef.current) {
      comboUIRef.current.innerText = `${s.combo}x`;
      const isLegendary = s.combo >= 25;
      const isStreak = s.combo >= 10;
      
      comboUIRef.current.className = `text-2xl md:text-4xl font-black tabular-nums relative z-10 transition-colors ${
        isLegendary
          ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"
          : isStreak
          ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          : s.combo > 0
          ? "text-white"
          : "text-white/30"
      }`;
    }
    
    if (accuracyUIRef.current) {
      const total = s.hits + s.misses;
      const acc = total > 0 ? Math.round((s.hits / total) * 100) : 100;
      accuracyUIRef.current.innerText = `${acc}%`;
    }

    if (progressBarRef.current && songDuration > 0) {
      const progress = Math.min(100, (s.gameTime / songDuration) * 100);
      progressBarRef.current.style.width = `${progress}%`;
    }
  }, [songDuration]);

  // ── Render Loop (Canvas Imperativa O(1)) ────────────────
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
      ctx.scale(dpr, dpr);
    };

    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // LOOP PRINCIPAL
    const tick = () => {
      if (!isPlaying) {
        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 0, width, height);
        
        // 25% da altura para teclado
        const KEYBOARD_HEIGHT_IDLE = Math.round(height * 0.25);
        const HIT_Y_IDLE = height - KEYBOARD_HEIGHT_IDLE; 

        ctx.fillStyle = COLORS.hitZoneLine;
        ctx.fillRect(0, HIT_Y_IDLE, width, 1.5);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        return;
      }

      const state = stateRef.current;

      const laneW = width / whiteNotes.length;
      
      const getNoteRect = (midi: number) => {
        if (!isBlackKey(midi)) {
            const idx = whiteNotes.indexOf(midi);
            return { x: idx * laneW, w: laneW, isBlack: false };
        } else {
            const prevWhite = midi - 1;
            const idx = whiteNotes.indexOf(prevWhite);
            const w = laneW * 0.55; // Tecla preta mais fina
            const x = (idx + 1) * laneW - (w / 2);
            return { x, w, isBlack: true };
        }
      };

      // ── PROPORÇÃO 75/25: Teclado = 25% da altura ──
      const KEYBOARD_HEIGHT = Math.round(height * 0.25);
      const HIT_Y = height - KEYBOARD_HEIGHT; 
      const SPEED_PX_PER_SEC = (height - KEYBOARD_HEIGHT) / VIEWPORT_SECONDS;

      // --- Cálculo de Delta Time para Relógio Interno ---
      const nowMs = performance.now();
      if (state.lastTickTime === 0) state.lastTickTime = nowMs;
      const dt = (nowMs - state.lastTickTime) / 1000;
      state.lastTickTime = nowMs;

      const rawAudioTime = getAudioTime();
      
      if (state.internalGameTime === 0 && rawAudioTime < 0) {
         state.internalGameTime = rawAudioTime;
      }

      const isWaiting = isWaitingMode && notes.some((n, idx) => !state.hitNotes.has(idx) && !state.missedNotes.has(idx) && state.internalGameTime >= n.time);

      if (!isWaiting) {
        state.internalGameTime += Math.min(dt * playbackSpeed, 2.0);
      }

      const elapsed = state.internalGameTime;
      state.gameTime = elapsed;

      // --- Metrônomo ---
      const bpm = 120;
      const secondsPerBeat = 60 / bpm;
      const currentBeat = Math.floor(elapsed / secondsPerBeat);
      
      if (currentBeat > state.lastBeat && elapsed >= 0) {
        state.lastBeat = currentBeat;
        const isWaitingNow = isWaitingMode && notes.some((n, idx) => !state.hitNotes.has(idx) && !state.missedNotes.has(idx) && elapsed >= n.time);
        if (!isWaitingNow) {
          onPlayTick?.(metronomeVolume); 
        }
      }

      // Limpar Canvas
      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, width, height);

      // --- 1. Grade ---
      ctx.lineWidth = 1;

      // 1a. Linhas Horizontais
      ctx.strokeStyle = COLORS.gridHorizontal;
      const beatSpacing = secondsPerBeat * SPEED_PX_PER_SEC;
      const firstBeatY = (elapsed % secondsPerBeat) * SPEED_PX_PER_SEC;
      
      ctx.beginPath();
      for (let y = firstBeatY; y < height; y += beatSpacing) {
        ctx.moveTo(0, HIT_Y - y);
        ctx.lineTo(width, HIT_Y - y);
        ctx.moveTo(0, HIT_Y + y);
        ctx.lineTo(width, HIT_Y + y);
      }
      ctx.stroke();

      // 1b. Linhas Verticais
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath();
      for (let i = 0; i <= whiteNotes.length; i++) {
        ctx.moveTo(i * laneW, 0);
        ctx.lineTo(i * laneW, height);
      }
      ctx.stroke();

      // --- 2. Hit Zone Gradient ---
      const gradient = ctx.createLinearGradient(0, HIT_Y - 40, 0, HIT_Y);
      gradient.addColorStop(0, "rgba(0,234,255,0)");
      gradient.addColorStop(1, "rgba(0,234,255,0.1)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, HIT_Y - 40, width, 40);

      // ── GLOW VIBRANTE nas teclas ativas ──
      activeNotes.forEach((_val, midi) => {
        const rect = getNoteRect(midi);
        const isRight = midi >= 60;
        const glowGradient = ctx.createRadialGradient(
          rect.x + rect.w / 2, HIT_Y, 0,
          rect.x + rect.w / 2, HIT_Y, rect.w * 1.5
        );
        if (isRight) {
          glowGradient.addColorStop(0, "rgba(234, 179, 8, 0.35)");
          glowGradient.addColorStop(1, "rgba(234, 179, 8, 0)");
        } else {
          glowGradient.addColorStop(0, "rgba(34, 197, 94, 0.35)");
          glowGradient.addColorStop(1, "rgba(34, 197, 94, 0)");
        }
        ctx.fillStyle = glowGradient;
        ctx.fillRect(rect.x - rect.w, HIT_Y - rect.w * 1.5, rect.w * 3, rect.w * 3);
      });
      
      // Labels de nota na base
      ctx.font = "11px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.textFaded;
      whiteNotes.forEach((midi: number, i: number) => {
        ctx.fillText(midiNoteToName(midi).replace(/\d/, ""), i * laneW + laneW / 2, height - 8);
      });

      // --- 3. Cleanup de Passos ---
      const missedSet = state.missedNotes;
      const hitSet = state.hitNotes;
      
      let missesAdded = false;

      notes.forEach((ns, i) => {
        if (hitSet.has(i) || missedSet.has(i)) return;
        if (elapsed > ns.time + timingWindow) {
          missedSet.add(i);
          state.combo = 0;
          state.misses += 1;
          missesAdded = true;
          onNoteMiss?.(ns.midi);
          
          state.effects.push({
            id: state.effectId++,
            note: ns.midi,
            type: "miss",
            startTime: rawAudioTime,
          });
        }
      });
      
      if (missesAdded) updateHUD();

      // --- 4. Tocar Acompanhamento ---
      if (onPlayAccompaniment) {
        accompanimentNotes.forEach((ns, i) => {
          if (!state.playedAccompaniment.has(i) && elapsed >= ns.time) {
            state.playedAccompaniment.add(i);
            onPlayAccompaniment(ns.midi, ns.duration);
          }
        });
      }

      // --- 5. Renderizar Notas Dinamicamente ---
      for (let i = 0; i < notes.length; i++) {
        const ns = notes[i];
        
        const timeDiff = ns.time - elapsed;
        const noteHeight = Math.max((ns.duration * SPEED_PX_PER_SEC), 4);
        const yPos = HIT_Y - (timeDiff * SPEED_PX_PER_SEC) - noteHeight;
        
        if (yPos + noteHeight < -50 || yPos > height + 50) {
          continue;
        }

        const rectInfo = getNoteRect(ns.midi);
        const isSharp = rectInfo.isBlack;
        // Notas sustenidas: mais finas, sem padding extra
        const xPos = isSharp ? rectInfo.x : rectInfo.x + rectInfo.w * 0.1;
        const rectW = isSharp ? rectInfo.w : rectInfo.w * 0.8;
        
        const isHit = hitSet.has(i);
        const isMiss = missedSet.has(i);
        
        const isRightHand = ns.midi >= 60; 
        
        let alpha = 0.9;
        if (isHit) alpha = Math.max(0, 1 - (elapsed - ns.time) * 4);
        else if (isMiss) alpha = Math.max(0, 0.5 - (elapsed - ns.time));

        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;

        // ── Note Body: Sustenidas mais saturadas, normais translúcidas ──
        const noteGradient = ctx.createLinearGradient(xPos, yPos, xPos, yPos + noteHeight);
        if (isSharp) {
          // Cores FORTES para sustenidos
          if (isRightHand) {
            noteGradient.addColorStop(0, "#F59E0B"); // Amber 500
            noteGradient.addColorStop(1, "#B45309"); // Amber 700
          } else {
            noteGradient.addColorStop(0, "#059669"); // Emerald 600
            noteGradient.addColorStop(1, "#065F46"); // Emerald 800
          }
        } else {
          if (isRightHand) {
            noteGradient.addColorStop(0, "#FEF08A"); // Yellow 200
            noteGradient.addColorStop(1, "#EAB308"); // Yellow 600
          } else {
            noteGradient.addColorStop(0, "#BBF7D0"); // Green 200
            noteGradient.addColorStop(1, "#16A34A"); // Green 600
          }
        }

        ctx.fillStyle = isHit ? "#FFFFFF" : noteGradient;
        ctx.strokeStyle = isHit ? "#FFFFFF" : isSharp ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)";
        ctx.lineWidth = isSharp ? 2 : 1.5;

        // Glow
        ctx.shadowBlur = isHit ? 25 : isSharp ? 14 : 10;
        ctx.shadowColor = isRightHand 
          ? (isSharp ? "rgba(245, 158, 11, 0.8)" : "rgba(234, 179, 8, 0.6)") 
          : (isSharp ? "rgba(5, 150, 105, 0.8)" : "rgba(34, 197, 94, 0.6)");

        // Draw Rounded Rect Note
        ctx.beginPath();
        ctx.roundRect(xPos, yPos, rectW, noteHeight, isSharp ? 4 : 6);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Inner Label
        if (noteHeight > 25) {
          ctx.fillStyle = isSharp ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
          ctx.font = `bold ${isSharp ? 11 : 13}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          const label = midiNoteToName(ns.midi);
          ctx.fillText(label, xPos + rectW / 2, yPos + noteHeight - 12);
        }
      }

      ctx.globalAlpha = 1.0;

      // --- 5. Renderizar Efeitos Visuais ---
      const activeEffects: VisualEffect[] = [];
      
      for (const eff of state.effects) {
        const effAge = rawAudioTime - eff.startTime;
        if (effAge > 0.6) continue;
        
        activeEffects.push(eff);
        
        const isMiss = eff.type === "miss";
        const isPerf = eff.type === "perfect";
        
        // ── PARTÍCULAS VIBRANTES ──
        if (!eff.sparked && !isMiss) {
          eff.sparked = true;
          const effRect = getNoteRect(eff.note);
          const isRightHand = eff.note >= 60;
          
          // Quantidade de partículas baseada no combo
          const particleCount = isPerf ? 24 : 14;
          const baseColors = isRightHand 
            ? ["#FACC15", "#FDE68A", "#F59E0B", "#FFFFFF"] 
            : ["#4ADE80", "#86EFAC", "#10B981", "#FFFFFF"];
          
          for (let i = 0; i < particleCount; i++) {
            state.particles.push({
              x: effRect.x + effRect.w / 2 + (Math.random() - 0.5) * effRect.w,
              y: HIT_Y,
              vx: (Math.random() - 0.5) * 10,
              vy: -Math.random() * 8 - 2,
              life: Math.random() * 0.4 + 0.2,
              maxLife: 0.6,
              color: baseColors[Math.floor(Math.random() * baseColors.length)],
              size: Math.random() * 3 + 1.5,
            });
          }
        }

        const tScale = Math.min(effAge * 4, 1);
        const opacity = Math.max(0, 1 - effAge * 1.5);
        
        const effRect2 = getNoteRect(eff.note);
        const baseX = effRect2.x + effRect2.w / 2;
        const baseY = HIT_Y - (effAge * 80);
        
        ctx.globalAlpha = opacity;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${16 + tScale * 14}px sans-serif`;
        
        ctx.shadowBlur = 15;
        if (isPerf) {
          ctx.fillStyle = "#34D399";
          ctx.shadowColor = "rgba(52,211,153,0.8)";
          ctx.fillText("★", baseX, baseY);
        } else if (isMiss) {
          ctx.fillStyle = "#FF00E5";
          ctx.shadowColor = "rgba(255,0,229,0.8)";
          ctx.fillText("✗", baseX, baseY);
        } else {
          ctx.fillStyle = "#34D399";
          ctx.shadowColor = "rgba(52,211,153,0.5)";
          ctx.fillText("✓", baseX, baseY);
        }
      }
      state.effects = activeEffects;

      // --- 6. Renderizar Partículas Dinâmicas ---
      const activeParticles: Particle[] = [];
      for (const p of state.particles) {
        p.life -= (1 / 60);
        if (p.life <= 0) continue;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;

        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        activeParticles.push(p);
      }
      state.particles = activeParticles;

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Fim do loop - Checar se música acabou
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

      // Atualizar progresso
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
  }, [isPlaying, getAudioTime, notes, difficulty, onNoteMiss, onScoreUpdate, onSongEnd, timingWindow, updateHUD, startNote, endNote, isFreePlay, whiteNotes, totalWidth, onPlayTick, songDuration, isWaitingMode, accompanimentNotes, onPlayAccompaniment, playbackSpeed, metronomeVolume, activeNotes]);


  // ── Input Binding Dinâmico via MIDI ──
  useEffect(() => {
    if (!isPlaying) return;
    
    const activeStateHash = Array.from(activeNotes.entries())
      .map(([k, v]) => `${k}-${v.velocity}`)
      .join("|");
      
    if (activeStateHash === lastActiveNotesState.current) return;
    lastActiveNotesState.current = activeStateHash;

    const s = stateRef.current;
    let uiChanged = false;

    activeNotes.forEach((midiNote) => {
      if (isFreePlay) {
         const isAlreadyHitThisFrame = s.effects.some((eff: VisualEffect) => eff.note === midiNote.note && (getAudioTime() - eff.startTime) < 0.1);
         
         if (!isAlreadyHitThisFrame) {
            s.score += 10;
            uiChanged = true;
            s.effects.push({
              id: s.effectId++,
              note: midiNote.note,
              type: "perfect",
              startTime: getAudioTime(),
            });
            onNoteHit?.(midiNote.note, 0.5, midiNote.velocity ?? 0.8);
         }
      } else {
        const matchIdx = notes.findIndex((ns, i) => {
          if (s.hitNotes.has(i) || s.missedNotes.has(i)) return false;
          if (ns.midi !== midiNote.note) return false;
          return Math.abs(s.gameTime - ns.time) <= timingWindow;
        });

        if (matchIdx !== -1) {
          s.hitNotes.add(matchIdx);
          const ns = notes[matchIdx];

          s.combo += 1;
          const comboMultiplier = Math.floor(s.combo / 5) + 1;
          s.score += 100 * comboMultiplier;
          s.hits += 1;
          uiChanged = true;

          s.effects.push({
            id: s.effectId++,
            note: ns.midi,
            type: s.combo >= 10 ? "perfect" : "hit",
            startTime: getAudioTime(),
          });

          onNoteHit?.(ns.midi, ns.duration, ns.velocity ?? 0.8);
        }
      }
    });

    if (uiChanged) updateHUD();
  }, [activeNotes, isPlaying, timingWindow, onNoteHit, notes, updateHUD, getAudioTime, isFreePlay]);


  return (
    <div className="relative w-full flex-1 rounded-3xl overflow-hidden border border-white/[0.1] bg-zinc-950 shadow-2xl">
      
      {/* ── Dark Grid Background ── */}
      <div className="absolute inset-0 opacity-20" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* ── Camada de Vinheta ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/60 pointer-events-none" />

      {/* ── BARRA DE PROGRESSO ── */}
      {!isFreePlay && songDuration > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[80%] max-w-2xl h-6 bg-zinc-900/80 border border-white/10 rounded-full z-40 flex items-center px-1 overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-20">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className={`w-[1px] bg-white ${i % 5 === 0 ? 'h-3' : 'h-1.5'} self-center`} />
            ))}
          </div>
          
          <div className="relative w-full h-full">
            <div 
              ref={progressBarRef}
              className="absolute top-1/2 -translate-y-1/2 h-3 w-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)] transition-[left] duration-300 ease-linear"
              style={{ left: '0%' }}
            />
          </div>
        </div>
      )}

      {/* ── CONTAINER UNIFICADO (Notas + Teclado) ── */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="relative w-full h-full">
          
          {/* Canvas de Notas (100%) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block w-full h-full pointer-events-none"
          />

          {/* TECLADO VIRTUAL: 25% da altura */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto" style={{ height: '25%' }}>
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



      {/* ── HUD de Score ── */}
      <div className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 flex items-center justify-between pointer-events-none z-30">
        <div className="glass rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 border border-white/10 shadow-lg">
          <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0 md:mb-1">Pontos</p>
          <p ref={scoreUIRef} className="text-lg md:text-2xl font-black tabular-nums text-gradient">0</p>
        </div>

        <div className="glass rounded-xl md:rounded-2xl px-5 md:px-8 py-2 md:py-4 text-center border border-white/10 shadow-lg min-w-[100px] md:min-w-[130px]">
          <p className="text-[9px] md:text-xs text-white/40 uppercase tracking-[3px] font-black mb-0 md:mb-1">Combos</p>
          <p ref={comboUIRef} className="text-2xl md:text-4xl font-black tabular-nums text-white/30">0x</p>
        </div>

        <div className="glass rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 text-right border border-white/10 shadow-lg">
          <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0 md:mb-1">Precisão</p>
          <p ref={accuracyUIRef} className="text-lg md:text-2xl font-black text-white tabular-nums">100%</p>
        </div>
      </div>

    </div>
  );
}
