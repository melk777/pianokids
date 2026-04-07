"use client";

import React from "react";
import type { MIDINote } from "@/hooks/useMIDI";
import { midiNoteToName } from "@/hooks/useMIDI";

interface VirtualKeyboardProps {
  onPlayNote: (midi: number) => void;
  onReleaseNote: (midi: number) => void;
  activeNotes?: Map<number, MIDINote | boolean>; // Opcional: para feedback visual de notas ativas
  className?: string;
  startNote?: number;
  endNote?: number;
}

const isBlackKey = (midi: number) => {
  const mod = midi % 12;
  return [1, 3, 6, 8, 10].includes(mod);
};



export default function VirtualKeyboard({ 
  onPlayNote, 
  onReleaseNote, 
  activeNotes, 
  className,
  startNote = 48,
  endNote = 77
}: VirtualKeyboardProps) {
  const notes = Array.from({ length: endNote - startNote + 1 }, (_, i) => startNote + i);

  const whiteNotes = notes.filter((n) => !isBlackKey(n));

  // Estado local para feedback instantâneo (otimizado para toque)
  const [pressedNotes, setPressedNotes] = React.useState<Set<number>>(new Set());

  const startPlay = (midi: number) => {
    setPressedNotes(prev => new Set(prev).add(midi));
    onPlayNote(midi);
  };

  const stopPlay = (midi: number) => {
    setPressedNotes(prev => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
    onReleaseNote(midi);
  };

  return (
    <div className={`relative w-full h-full select-none ${className}`}>
      <div className="relative h-full flex w-full p-0 bg-zinc-900 border-t-4 border-black shadow-inner">
          
        {/* Camada das Teclas Brancas */}
        <div className="flex h-full w-full gap-0">
          {whiteNotes.map((note) => {
            const isActive = activeNotes?.has(note) || pressedNotes.has(note);
            const isRightHand = note >= 60; // Split at C4
            
            // Cores baseadas na mão (Verde Esquerda, Amarelo Direita)
            const activeColor = isRightHand ? "rgba(234, 179, 8, 0.4)" : "rgba(34, 197, 94, 0.4)";
            const activeGradient = isRightHand ? "from-zinc-100 to-yellow-400" : "from-zinc-100 to-green-400";
            const glowColor = isRightHand ? "bg-yellow-400" : "bg-green-500";

            return (
              <button
                key={note}
                onMouseDown={(e) => { e.preventDefault(); startPlay(note); }}
                onMouseUp={() => stopPlay(note)}
                onMouseLeave={() => pressedNotes.has(note) && stopPlay(note)}
                onTouchStart={(e) => { e.preventDefault(); startPlay(note); }}
                onTouchEnd={(e) => { e.preventDefault(); stopPlay(note); }}
                className={`relative flex-1 h-full rounded-b-xl border-x border-zinc-200/50 transition-all duration-75 flex flex-col justify-end items-center pb-8 active:translate-y-1 touch-none group ${
                  isActive 
                    ? `bg-gradient-to-b ${activeGradient} shadow-[inset_0_-8px_15px_${activeColor},0_10px_20px_rgba(0,0,0,0.4)] translate-y-1` 
                    : "bg-gradient-to-b from-white via-zinc-50 to-zinc-200 shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.2)] hover:to-zinc-300"
                }`}
                style={{ zIndex: 1 }}
              >
                {/* Ativity Glow on top */}
                {isActive && <div className={`absolute top-0 left-0 right-0 h-1 shadow-[0_4px_12px_${activeColor}] z-20 ${glowColor}`} />}

                {/* Note Label (Central C4 special identifier mentioned in request) */}
                <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? "text-white" : "text-zinc-400"}`}>
                  {midiNoteToName(note) === "C4" ? "C4" : midiNoteToName(note).replace(/\d/, "")}
                </span>
                
                {/* 3D Reflection bevel on bottom */}
                {!isActive && <div className="absolute bottom-1 left-1 right-1 h-[2px] bg-white/60 rounded-full blur-[1px]" />}
              </button>
            );
          })}
        </div>

        {/* Camada das Teclas Pretas (Absolute Overlay) */}
        <div className="absolute top-0 left-0 w-full h-[62%] pointer-events-none p-0 flex">
          {whiteNotes.map((whiteNote, i) => {
            const blackNote = whiteNote + 1;
            const hasBlackNext = isBlackKey(blackNote) && blackNote <= endNote;
            
            // Largura de uma tecla branca em %
            const whiteKeyWidthPercent = 100 / whiteNotes.length;
            
            if (!hasBlackNext) return null;

            const isActive = activeNotes?.has(blackNote) || pressedNotes.has(blackNote);
            const isRightHand = blackNote >= 60;
            const activeColor = isRightHand ? "rgba(234, 179, 8, 0.5)" : "rgba(34, 197, 94, 0.5)";
            const activeGradient = isRightHand ? "from-zinc-800 to-yellow-600" : "from-zinc-800 to-green-600";
            const glowColor = isRightHand ? "bg-yellow-400" : "bg-green-500";

            // Posição: 110% pra alinhar entre a atual e a próxima
            const leftPosition = (i + 1) * whiteKeyWidthPercent;

            return (
              <button
                key={`black-${blackNote}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startPlay(blackNote); }}
                onMouseUp={() => stopPlay(blackNote)}
                onMouseLeave={() => pressedNotes.has(blackNote) && stopPlay(blackNote)}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); startPlay(blackNote); }}
                onTouchEnd={(e) => { e.preventDefault(); stopPlay(blackNote); }}
                className={`absolute top-0 w-[5%] h-full rounded-b-lg transition-all duration-75 pointer-events-auto z-10 touch-none flex flex-col items-center justify-end pb-5 shadow-2xl ${
                  isActive
                    ? `bg-gradient-to-b ${activeGradient} shadow-[inset_0_-6px_10px_${activeColor},0_8px_15px_rgba(0,0,0,0.5)] translate-y-1`
                    : "bg-gradient-to-br from-zinc-700 via-zinc-800 to-black border-x border-b border-white/10 shadow-[inset_0_-3px_0_rgba(255,255,255,0.05),0_10px_10px_rgba(0,0,0,0.6)] hover:brightness-125"
                }`}
                style={{ 
                  left: `${leftPosition}%`,
                  transform: `translateX(-50%) ${isActive ? 'translateY(4px)' : ''}`,
                  width: `${whiteKeyWidthPercent * 0.65}%`, // 65% da branca 
                  minWidth: '20px'
                }}
              >
                 {/* Ativity Glow on top (Black Keys) */}
                 {isActive && <div className={`absolute top-0 left-0 right-0 h-1 shadow-[0_4px_10px_${activeColor}] z-20 ${glowColor}`} />}

                {/* Reflection highlights */}
                {!isActive && <div className="absolute top-[2px] left-[4px] right-[4px] h-[4px] bg-white/5 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
