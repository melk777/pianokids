"use client";

import { useRef, useEffect, useCallback } from "react";
import type { SongNote } from "@/lib/songs";
import { midiNoteToName } from "@/hooks/useMIDI";
import type { Difficulty } from "@/lib/songFilters";
import { TIMING_WINDOWS } from "@/lib/songFilters";

/* ── Types ───────────────────────────────────────────── */

interface PianoPlayerProps {
  notes: SongNote[];            // Pre-filtered by difficulty
  difficulty: Difficulty;
  activeNotes: Map<number, { note: number; velocity: number; timestamp: number }>;
  isPlaying: boolean;
  getAudioTime: () => number;   // Sync exactly with AudioContext.currentTime
  onScoreUpdate?: (score: number, combo: number, accuracy: number) => void;
  onSongEnd?: () => void;
  onNoteHit?: (midi: number, duration: number, velocity: number) => void;
  onNoteMiss?: (midi: number) => void;
  startNote?: number;           // physical piano start note
  endNote?: number;             // physical piano end note
  isFreePlay?: boolean;         // Modo infinito livre (Sandbox) sem notas.
}

/* ── Constants ───────────────────────────────────────── */

const VIEWPORT_SECONDS = 4;
const HIT_ZONE_PERCENT = 0.85;

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
  startNote = 48,
  endNote = 76,
  isFreePlay = false,
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
  });

  const animFrameRef = useRef<number>(0);
  const timingWindow = TIMING_WINDOWS[difficulty];
  const lastActiveNotesState = useRef<string>("");

  // Refs para os elementos de HUD (atualização fora do React DOM Tree)
  const scoreUIRef = useRef<HTMLParagraphElement>(null);
  const comboUIRef = useRef<HTMLParagraphElement>(null);
  const accuracyUIRef = useRef<HTMLParagraphElement>(null);

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
  }, []);

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
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Pré-cálculo da Física do Teclado (Lanes idênticas ao Piano físico)
    const whiteNotes: number[] = [];
    for (let i = startNote; i <= endNote; i++) {
        if (!isBlackKey(i)) whiteNotes.push(i);
    }
    
    const laneW = width / whiteNotes.length;
    
    // Calcula o centro exato do X de cada nota (seja branca ou preta)
    const getNoteRect = (midi: number) => {
        if (!isBlackKey(midi)) {
            const idx = whiteNotes.indexOf(midi);
            return { x: idx * laneW, w: laneW, isBlack: false };
        } else {
            const prevWhite = midi - 1;
            const idx = whiteNotes.indexOf(prevWhite);
            const w = laneW * 0.55;
            const x = (idx + 1) * laneW - (w / 2);
            return { x, w, isBlack: true };
        }
    };
    
    const HIT_Y = height * HIT_ZONE_PERCENT;
    const SPEED_PX_PER_SEC = height / VIEWPORT_SECONDS;

    // LOOP PRINCIPAL
    const tick = () => {
      if (!isPlaying) {
        // Se parado mas com estado sujo, desenha a tela inicial (vazia ou pausada)
        ctx.fillStyle = "#0A0A0A"; // BG Black
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = COLORS.hitZoneLine;
        ctx.fillRect(0, HIT_Y, width, 1.5);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        return;
      }

      const state = stateRef.current;

      // Sincronia ABSOLUTA com áudio. (Não usar StartTime diff).
      const rawAudioTime = getAudioTime();
      // getAudioTime already subtracts audioStartTimeRef, representing exact game seconds.
      const elapsed = rawAudioTime;
      state.gameTime = elapsed;

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

      // --- 2. Hit Zone Line ---
      const gradient = ctx.createLinearGradient(0, HIT_Y - 20, 0, HIT_Y);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.03)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, HIT_Y - 20, width, 20);

      ctx.strokeStyle = COLORS.hitZoneLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, HIT_Y);
      ctx.lineTo(width, HIT_Y);
      ctx.stroke();
      
      // Labels de nota na base apenas para The White Keys para imersão
      ctx.font = "12px var(--font-geist-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.textFaded;
      whiteNotes.forEach((midi, i) => {
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
        
        // Cores Didáticas: Brancas -> Fundo Branco. Pretas (Sustenidos) -> Fundo Preto.
        let fill = rectInfo.isBlack ? "rgba(24, 24, 27, 0.95)" : "rgba(250, 250, 250, 0.95)";
        let stroke = rectInfo.isBlack ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.8)";
        // Efeito Neon Nativo: Brilho constante na cor da própria nota caindo
        let shadowColor = fill;
        let shadowBlur = 8; // glow base
        let alpha = 1.0;

        if (isHit) {
          fill = state.combo >= 10 ? COLORS.comboGlow : COLORS.hitNormal;
          stroke = COLORS.hitStroke;
          shadowColor = stroke;
          shadowBlur = 15; // glow mais intenso no acerto
          alpha = Math.max(0, 1 - (elapsed - ns.time) * 4); // Fast Fade Out
        } else if (isMiss) {
          fill = COLORS.missedFill;
          stroke = COLORS.missedStroke;
          alpha = Math.max(0, 0.5 - (elapsed - ns.time)); // Super Fast Fade Out na base
        }

        if (alpha <= 0) continue;

        ctx.globalAlpha = Math.min(Math.max(alpha, 0), 1);
        ctx.shadowColor = shadowBlur > 0 ? shadowColor : "transparent";
        ctx.shadowBlur = shadowBlur;
        
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = rectInfo.isBlack ? 1 : 1.5;

        // Desenhar bloco de nota usando coordenadas sub-pixel (mas bordas visuais fiéis)
        ctx.beginPath();
        ctx.roundRect(xPos, yPos, rectW, noteHeight, 4);
        ctx.fill();
        if (stroke !== "transparent") ctx.stroke();

        ctx.shadowBlur = 0; // reset shadow for text

        if (!isHit && !isMiss && noteHeight > 10) {
          // Contraste para a letra: Se o bloco for preto, letra branca. Se bloco for branco, letra preta.
          ctx.fillStyle = rectInfo.isBlack ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)";
          ctx.font = "bold 13px var(--font-geist-mono), monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // Math.round AQUI evita o 'shivering/pulsating' da engine de Anti-Aliasing do Canvas 
          // quando o texto tenta ser renderizado em linhas decimais movendo pra baixo rapidamente.
          const textX = Math.round(xPos + rectW / 2);
          const textY = Math.round(yPos + noteHeight / 2);
          
          // Replace \d remove o número da oitava (ex: C4 -> C), deixando mais didático pras crianças
          ctx.fillText(midiNoteToName(ns.midi).replace(/\d/, ""), textX, textY);
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

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, getAudioTime, notes, difficulty, onNoteMiss, onScoreUpdate, onSongEnd, timingWindow, updateHUD, startNote, endNote, isFreePlay]);

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
         const isAlreadyHitThisFrame = s.effects.some(e => e.note === midiNote.note && (getAudioTime() - e.startTime) < 0.1);
         
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
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-white/[0.06] bg-black bg-opacity-40 backdrop-blur-sm pointer-events-none">
      
      {/* ── Background Video Render em Loop ── */}
      <video
        src="/videos/background.webm"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* ── Camada Escura Semi-Transparente solicitada ── */}
      <div className="absolute inset-0 bg-black/50" />

      {/* ── Tela de Rendereização de Alta Performance O(1) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />

      {/* ── HUD de Score Desacoplada do React Lifecycle ── */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="glass rounded-xl px-4 py-2 border border-white/[0.06]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider">Pontuação</p>
          <p ref={scoreUIRef} className="text-xl font-bold tabular-nums text-white">0</p>
        </div>

        <div className="glass rounded-xl px-4 py-2 text-center border border-white/[0.06] relative overflow-hidden">
          <p className="text-[10px] text-white/35 uppercase tracking-wider relative z-10">Combo</p>
          <p ref={comboUIRef} className="text-xl font-bold tabular-nums relative z-10 transition-colors text-white/30">
            0x
          </p>
        </div>

        <div className="glass rounded-xl px-4 py-2 text-right border border-white/[0.06]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider">Precisão</p>
          <p ref={accuracyUIRef} className="text-xl font-bold text-white tabular-nums">
            100%
          </p>
        </div>
      </div>
    </div>
  );
}
