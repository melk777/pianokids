"use client";

import React, { memo, useState, useCallback } from "react";
import type { MIDINote } from "@/hooks/useMIDI";
import { midiNoteToName } from "@/hooks/useMIDI";

interface VirtualKeyboardProps {
  onPlayNote: (midi: number) => void;
  onReleaseNote: (midi: number) => void;
  activeNotes?: Map<number, MIDINote | boolean>;
  className?: string;
  startNote?: number;
  endNote?: number;
}

const isBlackKey = (midi: number) => {
  const mod = midi % 12;
  return [1, 3, 6, 8, 10].includes(mod);
};

// ----------------------------------------------------------------------------
// Componente Memoizado para a Tecla Branca
// Evita re-renderizações desnecessárias em 50+ teclas sempre que uma for tocada
// ----------------------------------------------------------------------------
const WhiteKey = memo(({ note, isActiveProp, onPlayNote, onReleaseNote, noteName, letterOnly }: any) => {
  const isRightHand = note >= 60;
  
  // Feedback visual ultra-rápido isolado apenas neste botão
  const [isPressed, setIsPressed] = useState(false);
  
  const isActive = isActiveProp || isPressed;
  const activeGradient = isRightHand ? "from-zinc-100 to-yellow-400" : "from-zinc-100 to-green-400";
  const glowColor = isRightHand ? "bg-yellow-400" : "bg-green-500";
  const activeColor = isRightHand ? "rgba(234, 179, 8, 0.4)" : "rgba(34, 197, 94, 0.4)";

  // Event handlers utilizando useCallback para evitar re-criação
  const handleDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onPlayNote(note);
  }, [note, onPlayNote]);

  const handleUp = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    if (!isPressed) return;
    setIsPressed(false);
    onReleaseNote(note);
  }, [note, onReleaseNote, isPressed]);

  return (
    <button
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchEnd={handleUp}
      className={`relative flex-1 h-full rounded-b-xl border-x border-zinc-200/50 transition-all duration-75 flex flex-col justify-end items-center pb-3 active:translate-y-1 touch-none group ${
        isActive 
          ? `bg-gradient-to-b ${activeGradient} shadow-[inset_0_-8px_15px_${activeColor},0_10px_20px_rgba(0,0,0,0.4)] translate-y-1` 
          : "bg-gradient-to-b from-white via-zinc-50 to-zinc-200 shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.2)] hover:to-zinc-300"
      }`}
      style={{ zIndex: 1 }}
    >
      {/* Activity Glow on top */}
      {isActive && <div className={`absolute top-0 left-0 right-0 h-1 shadow-[0_4px_12px_${activeColor}] z-20 ${glowColor}`} />}

      {/* Rótulo da Nota (C, D, E, F, G, A, B) na borda inferior */}
      <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${
        isActive ? "text-white drop-shadow-lg" : "text-zinc-400/80"
      } ${noteName === "C4" ? "text-cyan" : ""}`}>
        {letterOnly}
      </span>
      
      {/* 3D Reflection */}
      {!isActive && <div className="absolute bottom-1 left-1 right-1 h-[2px] bg-white/60 rounded-full blur-[1px]" />}
    </button>
  );
});
WhiteKey.displayName = "WhiteKey";

// ----------------------------------------------------------------------------
// Componente Memoizado para a Tecla Preta
// ----------------------------------------------------------------------------
const BlackKey = memo(({ note, isActiveProp, onPlayNote, onReleaseNote, sharpLabel, leftPosition, whiteKeyWidthPercent }: any) => {
  const isRightHand = note >= 60;
  
  // Feedback visual instantâneo
  const [isPressed, setIsPressed] = useState(false);
  
  const isActive = isActiveProp || isPressed;
  const activeColor = isRightHand ? "rgba(234, 179, 8, 0.5)" : "rgba(34, 197, 94, 0.5)";
  const activeGradient = isRightHand ? "from-zinc-800 to-yellow-600" : "from-zinc-800 to-green-600";
  const glowColor = isRightHand ? "bg-yellow-400" : "bg-green-500";

  const handleDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPressed(true);
    onPlayNote(note);
  }, [note, onPlayNote]);

  const handleUp = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!isPressed) return;
    setIsPressed(false);
    onReleaseNote(note);
  }, [note, onReleaseNote, isPressed]);

  return (
    <button
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchEnd={handleUp}
      className={`absolute top-0 w-[5%] h-full rounded-b-lg transition-all duration-75 pointer-events-auto z-10 touch-none flex flex-col items-center justify-start pt-2 shadow-2xl ${
        isActive
          ? `bg-gradient-to-b ${activeGradient} shadow-[inset_0_-6px_10px_${activeColor},0_8px_15px_rgba(0,0,0,0.5)] translate-y-1`
          : "bg-gradient-to-br from-zinc-700 via-zinc-800 to-black border-x border-b border-white/10 shadow-[inset_0_-3px_0_rgba(255,255,255,0.05),0_10px_10px_rgba(0,0,0,0.6)] hover:brightness-125"
      }`}
      style={{ 
        left: `${leftPosition}%`,
        transform: `translateX(-50%) ${isActive ? 'translateY(4px)' : ''}`,
        width: `${whiteKeyWidthPercent * 0.65}%`,
        minWidth: '20px'
      }}
    >
       {/* Activity Glow on top (Black Keys) */}
       {isActive && <div className={`absolute top-0 left-0 right-0 h-1 shadow-[0_4px_10px_${activeColor}] z-20 ${glowColor}`} />}

      {/* Rótulo # na borda SUPERIOR das teclas pretas */}
      <span className={`text-[7px] md:text-[8px] font-black tracking-wider ${
        isActive ? "text-white/90" : "text-white/25"
      }`}>
        {sharpLabel}
      </span>

      {/* Reflection highlights */}
      {!isActive && <div className="absolute top-[2px] left-[4px] right-[4px] h-[4px] bg-white/5 rounded-full" />}
    </button>
  );
});
BlackKey.displayName = "BlackKey";


export default function VirtualKeyboard({ 
  onPlayNote, 
  onReleaseNote, 
  activeNotes, 
  className,
  startNote = 36,
  endNote = 84
}: VirtualKeyboardProps) {
  const notes = Array.from({ length: endNote - startNote + 1 }, (_, i) => startNote + i);
  const whiteNotes = notes.filter((n) => !isBlackKey(n));

  return (
    <div className={`relative w-full h-full select-none ${className || ''}`}>
      <div className="relative h-full flex w-full p-0 bg-zinc-900 border-t-4 border-black shadow-inner">
          
        {/* Camada das Teclas Brancas */}
        <div className="flex h-full w-full gap-0">
          {whiteNotes.map((note) => {
            const noteName = midiNoteToName(note);
            const letterOnly = noteName.replace(/\d/, "");

            return (
              <WhiteKey 
                key={`white-${note}`}
                note={note}
                isActiveProp={Boolean(activeNotes?.has(note))}
                onPlayNote={onPlayNote}
                onReleaseNote={onReleaseNote}
                noteName={noteName}
                letterOnly={letterOnly}
              />
            );
          })}
        </div>

        {/* Camada das Teclas Pretas (Absolute Overlay) */}
        <div className="absolute top-0 left-0 w-full h-[62%] pointer-events-none p-0 flex">
          {whiteNotes.map((whiteNote, i) => {
            const blackNote = whiteNote + 1;
            const hasBlackNext = isBlackKey(blackNote) && blackNote <= endNote;
            
            if (!hasBlackNext) return null;
            
            const whiteKeyWidthPercent = 100 / whiteNotes.length;
            const leftPosition = (i + 1) * whiteKeyWidthPercent;
            const sharpLabel = midiNoteToName(blackNote).replace(/\d/, "");

            return (
              <BlackKey 
                key={`black-${blackNote}`}
                note={blackNote}
                isActiveProp={Boolean(activeNotes?.has(blackNote))}
                onPlayNote={onPlayNote}
                onReleaseNote={onReleaseNote}
                sharpLabel={sharpLabel}
                leftPosition={leftPosition}
                whiteKeyWidthPercent={whiteKeyWidthPercent}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
