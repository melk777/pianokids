"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import type { SongNote } from "@/lib/songs";
import { midiNoteToName, type MIDINote } from "@/hooks/useMIDI";
import type { Difficulty } from "@/lib/songFilters";
import { TIMING_WINDOWS } from "@/lib/songFilters";
import VirtualKeyboard from "./VirtualKeyboard";

/* ── Types ───────────────────────────────────────────── */

interface PianoPlayerProps {
  notes: SongNote[];            // Pre-filtered by difficulty
  difficulty: Difficulty;
  activeNotes: Map<number, MIDINote>;
  isPlaying: boolean;
  getAudioTime: () => number;   // Sync exactly with AudioContext.currentTime
  onScoreUpdate?: (score: number, combo: number, accuracy: number) => void;
  onSongEnd?: () => void;
  onNoteHit?: (midi: number, duration: number, velocity: number) => void;
  onNoteMiss?: (midi: number) => void;
  onPlayTick?: (velocity?: number) => void; // NOVO: Metrônomo
  onPlayNote?: (midi: number) => void;      // NOVO: Repassar clique virtual
  onReleaseNote?: (midi: number) => void;   // NOVO: Repassar soltura virtual
  resumeAudio?: () => Promise<void>;        // REINTRODUZIDO: Destravar áudio no mobile
  startNote?: number;           // physical piano start note
  endNote?: number;             // physical piano end note
  isFreePlay?: boolean;         // Modo infinito livre (Sandbox) sem notas.
  songDuration?: number;        // Duração total da música para a barra de progresso
}


/* ── Constants ───────────────────────────────────────── */

const VIEWPORT_SECONDS = 4;


/* ── Colors (Neon/Cyberpunk Hand-specific) ───────────── */

const COLORS = {
  rightHandFill: "rgba(0, 234, 255, 0.55)",       // Cyan / Blue
  rightHandStroke: "#00EAFF",
  leftHandFill: "rgba(16, 185, 129, 0.55)",       // Emerald / Green
  leftHandStroke: "#10B981",

  hitNormal: "rgba(255, 255, 255, 0.7)",          // White flash for hit
  hitStroke: "#FFFFFF",

  comboGlow: "rgba(252, 211, 77, 0.8)",           // Amber/Gold
  missedFill: "rgba(255, 0, 229, 0.3)",           // Magenta fade
  missedStroke: "#FF00E5",

  hitZoneLine: "rgba(255, 255, 255, 0.3)",
  grid: "rgba(255, 255, 255, 0.04)",
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
  endNote = 72,
  isFreePlay = false,
  songDuration = 0,
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
    };
    lastActiveNotesState.current = "";
    
    // Atualizar HUD para zero
    if (scoreUIRef.current) scoreUIRef.current.innerText = "0";
    if (comboUIRef.current) {
      comboUIRef.current.innerText = "0x";
      comboUIRef.current.className = "text-xl font-bold tabular-nums relative z-10 transition-colors text-white/30";
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
      
      comboUIRef.current.className = `text-xl font-bold tabular-nums relative z-10 transition-colors ${
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
    const ctx = canvas.getContext("2d", { alpha: false }); // alpha: false otimiza BG preto
    if (!ctx) return;

    // Ajuste de DPI/Retina Display
    const dpr = window.devicePixelRatio || 1;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    
    const resizeCanvas = () => {
      width = canvas.parentElement?.clientWidth || canvas.clientWidth;
      height = canvas.parentElement?.clientHeight || canvas.clientHeight;
      // Buffer interno agora segue a largura REAL da tela para ocupar tudo
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // LOOP PRINCIPAL
    const tick = () => {
      if (!isPlaying) {
        // Se parado mas com estado sujo, desenha a tela inicial (vazia ou pausada)
        ctx.fillStyle = "#0A0A0A"; // BG Black
        ctx.fillRect(0, 0, width, height);
        
        const isShortScreenIdle = height < 500;
        const KEYBOARD_HEIGHT_IDLE = isShortScreenIdle ? 180 : 280; 
        const HIT_Y_IDLE = height - KEYBOARD_HEIGHT_IDLE; 

        ctx.fillStyle = COLORS.hitZoneLine;
        ctx.fillRect(0, HIT_Y_IDLE, width, 1.5);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        return;
      }

      const state = stateRef.current;

      // FIX: Cálculo dinâmico de laneW (preenchimento total da tela)
      const laneW = width / whiteNotes.length;
      
      const getNoteRect = (midi: number) => {
        if (!isBlackKey(midi)) {
            const idx = whiteNotes.indexOf(midi);
            return { x: idx * laneW, w: laneW, isBlack: false };
        } else {
            const prevWhite = midi - 1;
            const idx = whiteNotes.indexOf(prevWhite);
            const w = laneW * 0.65; // Proporção da tecla preta
            const x = (idx + 1) * laneW - (w / 2);
            return { x, w, isBlack: true };
        }
      };

      const isShortScreen = height < 500;
      const KEYBOARD_HEIGHT = isShortScreen ? 180 : 280; 
      const HIT_Y = height - KEYBOARD_HEIGHT; 
      const SPEED_PX_PER_SEC = (height - KEYBOARD_HEIGHT) / VIEWPORT_SECONDS;

      // Sincronia ABSOLUTA com áudio. (Não usar StartTime diff).
      const rawAudioTime = getAudioTime();
      // getAudioTime already subtracts audioStartTimeRef, representing exact game seconds.
      const elapsed = rawAudioTime;
      state.gameTime = elapsed;

      // --- Metronomê (Tick on every beat) ---
      // We assume a 4/4 time signature for simplicity or use BPM to find beats
      // BPM logic: 1 beat = 60 / BPM seconds
      // However, notes usually have their own timing. 
      // If we have access to BPM via props, we use it.
      // Since BPM isn't in props, we'll try a default 120 or pass it.
      // Let's assume a standard pulse if BPM is missing.
      const bpm = 120; // Default fallback
      const secondsPerBeat = 60 / bpm;
      const currentBeat = Math.floor(elapsed / secondsPerBeat);
      
      if (currentBeat > state.lastBeat && elapsed >= 0) {
        state.lastBeat = currentBeat;
        onPlayTick?.(0.08); // Volume baixinhio solicitado
      }

      // Limpar Canvas
      ctx.fillStyle = "#09090B"; // Zinc 950 bg
      ctx.fillRect(0, 0, width, height);

      // --- 1. Grade (Lanes Brancas Divisórias idênticas as teclas) ---
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= whiteNotes.length; i++) {
        ctx.moveTo(i * laneW, 0);
        ctx.lineTo(i * laneW, height);
      }
      ctx.stroke();

      // --- 2. Hit Zone Gradient (sem linha sólida) ---
      const gradient = ctx.createLinearGradient(0, HIT_Y - 40, 0, HIT_Y);
      gradient.addColorStop(0, "rgba(0,234,255,0)");
      gradient.addColorStop(1, "rgba(0,234,255,0.1)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, HIT_Y - 40, width, 40);
      
      // Labels de nota na base apenas para The White Keys para imersão
      ctx.font = "12px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.textFaded;
      whiteNotes.forEach((midi: number, i: number) => {
        ctx.fillText(midiNoteToName(midi).replace(/\d/, ""), i * laneW + laneW / 2, height - 10);
      });

      // --- 3. Atualizar Cleanup de Passos (Tiros Perdidos) ---
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

      // --- 4. Renderizar Notas Dinamicamente O(1) ---
      for (let i = 0; i < notes.length; i++) {
        const ns = notes[i];
        
        // Posição Core
        const timeDiff = ns.time - elapsed;
        const noteHeight = Math.max((ns.duration * SPEED_PX_PER_SEC), 4);
        const yPos = HIT_Y - (timeDiff * SPEED_PX_PER_SEC) - noteHeight;
        
        // Cull estrito: Só processar nota se estiver cruzando a tela visual -> [-NoteHeight Até ViewHeight]
        if (yPos + noteHeight < -50 || yPos > height + 50) {
          continue; // Pule notas que estão fora da tela (Zero Lag garantido)
        }

        const rectInfo = getNoteRect(ns.midi);
        // Small padding inside the key lane
        const xPos = rectInfo.x + rectInfo.w * 0.1;
        const rectW = rectInfo.w * 0.8;
        
        const isHit = hitSet.has(i);
        const isMiss = missedSet.has(i);
        
        // --- EVOLVED VISUALS (From Reference Image) ---
        // Right hand (even notes approx) -> Cyan/Blue. Left hand -> Orange/Amber.
        const isRightHand = ns.hand === "right" || ns.midi >= 60; 
        
        let alpha = 1.0;
        if (isHit) alpha = Math.max(0, 1 - (elapsed - ns.time) * 4);
        else if (isMiss) alpha = Math.max(0, 0.5 - (elapsed - ns.time));

        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;

        // Note Body Gradient
        const noteGradient = ctx.createLinearGradient(xPos, yPos, xPos, yPos + noteHeight);
        if (isRightHand) {
          noteGradient.addColorStop(0, "#00EAFF"); // Top Bright
          noteGradient.addColorStop(1, "#0091FF"); // Bottom Deep
        } else {
          noteGradient.addColorStop(0, "#FDBA74"); // Top Orange
          noteGradient.addColorStop(1, "#F97316"); // Bottom Dark Orange
        }

        ctx.fillStyle = isHit ? "#FFFFFF" : noteGradient;
        ctx.strokeStyle = isHit ? "#FFFFFF" : "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;

        // Glow
        ctx.shadowBlur = isHit ? 20 : 12;
        ctx.shadowColor = isRightHand ? "rgba(0, 234, 255, 0.5)" : "rgba(249, 115, 22, 0.5)";

        // Draw Rounded Rect Note
        ctx.beginPath();
        ctx.roundRect(xPos, yPos, rectW, noteHeight, 8);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Inner Label (Note Name)
        if (noteHeight > 20) {
          ctx.fillStyle = "#000000";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          
          const label = midiNoteToName(ns.midi).replace(/\d/, "");
          ctx.fillText(label, xPos + rectW / 2, yPos + noteHeight - 8);
        }
      }

      ctx.globalAlpha = 1.0;

      // --- 5. Renderizar Efeitos Visuais (Partículas) ---
      const activeEffects: VisualEffect[] = [];
      
      for (const eff of state.effects) {
        const effAge = rawAudioTime - eff.startTime;
        if (effAge > 0.6) continue; // Morre em 600ms
        
        activeEffects.push(eff);
        
        const isMiss = eff.type === "miss";
        const isPerf = eff.type === "perfect";
        
        // --- SPARK PARTICLES (Dispara na explosão do acerto) ---
        if (!eff.sparked && !isMiss) {
          eff.sparked = true;
          const effRect = getNoteRect(eff.note);
          const pColor = isPerf ? "#34D399" : "#00EAFF";
          for(let i = 0; i < 12; i++) {
            state.particles.push({
              x: effRect.x + effRect.w / 2,
              y: HIT_Y,
              vx: (Math.random() - 0.5) * 8, // Explosão Horizontal
              vy: -Math.random() * 6 - 2,    // Explosão Vertical para cima
              life: Math.random() * 0.3 + 0.2,
              maxLife: 0.5,
              color: pColor
            });
          }
        }

        const tScale = Math.min(effAge * 4, 1); // 0 -> 1 rapidamente
        const opacity = Math.max(0, 1 - effAge * 1.5);
        
        const effRect2 = getNoteRect(eff.note);
        const baseX = effRect2.x + effRect2.w / 2;
        const baseY = HIT_Y - (effAge * 80); // Sobe enquanto dissolve
        
        ctx.globalAlpha = opacity;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${16 + tScale * 14}px sans-serif`;
        
        // Efeito Néon Subindo
        ctx.shadowBlur = 15;
        if (isPerf) {
          ctx.fillStyle = "#34D399"; // Emerald 400
          ctx.shadowColor = "rgba(52,211,153,0.8)";
          ctx.fillText("★", baseX, baseY);
        } else if (isMiss) {
          ctx.fillStyle = "#FF00E5"; // Magenta
          ctx.shadowColor = "rgba(255,0,229,0.8)";
          ctx.fillText("✗", baseX, baseY);
        } else {
          ctx.fillStyle = "#34D399";
          ctx.shadowColor = "rgba(52,211,153,0.5)";
          ctx.fillText("✓", baseX, baseY);
        }
      }
      state.effects = activeEffects; // Garbage collect effects array

      // --- 6. Renderizar Partículas Dinâmicas Físicas ---
      const activeParticles: Particle[] = [];
      for (const p of state.particles) {
        p.life -= (1 / 60); // approx framerate decrement
        if (p.life <= 0) continue;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // Simple Gravity pulling it down

        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
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
          // Envia score final e dispara encerramento limpo
          const total = state.hits + state.misses;
          const accuracy = total > 0 ? (state.hits / total) * 100 : 100;
          onScoreUpdate?.(state.score, state.combo, accuracy);
          onSongEnd?.();
          return;
        }
      }

      // Atualizar progresso a cada frame para suavidade (líquido)
      if (progressBarRef.current && songDuration > 0) {
        const progress = Math.min(100, (elapsed / songDuration) * 100);
        progressBarRef.current.style.width = `${progress}%`;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, getAudioTime, notes, difficulty, onNoteMiss, onScoreUpdate, onSongEnd, timingWindow, updateHUD, startNote, endNote, isFreePlay, whiteNotes, totalWidth]);


  // ── Input Binding Dinâmico via MIDI (Sincrono e Fora do JSX) ──
  useEffect(() => {
    if (!isPlaying) return;
    
    // Hash state detection para não rodar desnecessariamente se for a mesma nota segurada
    const activeStateHash = Array.from(activeNotes.entries())
      .map(([k, v]) => `${k}-${v.velocity}`)
      .join("|");
      
    if (activeStateHash === lastActiveNotesState.current) return;
    lastActiveNotesState.current = activeStateHash;

    const s = stateRef.current;
    let uiChanged = false;

    activeNotes.forEach((midiNote) => {
      if (isFreePlay) {
         // No Modo Livre, ignora buscar as notas da música, só joga confetes instantaneamente
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
        // Find eligible note para Acertos Normais
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


  // O HTML não recalcula quadros durante o uso. Apenas a HUD manipulada pela ref.
  return (
    <div className="relative w-full flex-1 rounded-3xl overflow-hidden border border-white/[0.1] bg-black shadow-2xl shadow-cyan/5">
      
      {/* ── Background Video ── */}
      <video
        src="/videos/background.webm"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      
      {/* ── Camada de Fundo do Jogo ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/40 to-black" />

      {/* ── BARRA DE PROGRESSO LÍQUIDA (Topo) ── */}
      {!isFreePlay && songDuration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-white/5 z-40 overflow-hidden">
          <div 
            ref={progressBarRef}
            className="h-full w-0 bg-gradient-to-r from-cyan/40 via-cyan to-cyan/80 relative transition-[width] duration-300 ease-out shadow-[0_0_15px_rgba(0,234,255,0.5)]"
          >
             {/* Efeito de Brilho/Líquido na ponta */}
             <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 blur-sm animate-pulse" />
          </div>
        </div>
      )}

      {/* ── CONTAINER DE SCROLL UNIFICADO (Notas + Teclado) ── */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="relative w-full h-full">
          
          {/* Tela de Renderização das Notas (Canvas 100% da largura) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block w-full h-full pointer-events-none"
          />

          {/* TECLADO VIRTUAL INTEGRADO (Hit Zone) */}
          <div className="absolute bottom-0 left-0 right-0 h-[180px] md:h-[280px] pointer-events-auto">
            <VirtualKeyboard 
              onPlayNote={(midi) => {
                // ATIVAÇÃO DIRETA DO ÁUDIO NO TOQUE (Criterial for Mobile Safari)
                resumeAudio?.();
                onPlayNote?.(midi);
              }} 
              onReleaseNote={onReleaseNote || (() => {})} 
              activeNotes={activeNotes}
            />
          </div>
        </div>
      </div>



      {/* ── HUD de Score (Fica fixo acima do scroll) ── */}
      <div className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 flex items-center justify-between pointer-events-none z-30">
        <div className="glass rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 border border-white/10 shadow-lg">
          <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0 md:mb-1">Score</p>
          <p ref={scoreUIRef} className="text-lg md:text-2xl font-black tabular-nums text-cyan">0</p>
        </div>

        <div className="glass rounded-xl md:rounded-2xl px-4 md:px-6 py-2 md:py-3 text-center border border-white/10 shadow-lg min-w-[80px] md:min-w-[100px]">
          <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0 md:mb-1">Combo</p>
          <p ref={comboUIRef} className="text-lg md:text-2xl font-black tabular-nums text-white/40">0x</p>
        </div>

        <div className="glass rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 text-right border border-white/10 shadow-lg">
          <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0 md:mb-1">Accuracy</p>
          <p ref={accuracyUIRef} className="text-lg md:text-2xl font-black text-white tabular-nums">100%</p>
        </div>
      </div>

    </div>
  );
}
