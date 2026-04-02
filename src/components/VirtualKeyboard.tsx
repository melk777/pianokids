"use client";

import React from "react";
import type { MIDINote } from "@/hooks/useMIDI";
import { midiNoteToName } from "@/hooks/useMIDI";

interface VirtualKeyboardProps {
  onPlayNote: (midi: number) => void;
  onReleaseNote: (midi: number) => void;
  activeNotes?: Map<number, MIDINote | boolean>; // Opcional: para feedback visual de notas ativas
  className?: string;
}

const isBlackKey = (midi: number) => {
  const mod = midi % 12;
  return [1, 3, 6, 8, 10].includes(mod);
};

export default function VirtualKeyboard({ onPlayNote, onReleaseNote, activeNotes, className }: VirtualKeyboardProps) {
  const startNote = 48; // C3
  const endNote = 72;   // C5
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
    <div className={`relative w-full h-full select-none bg-zinc-950/40 backdrop-blur-md border-t border-white/10 ${className}`}>
      {/* Container com Scroll para Mobile */}
      <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-hide touch-pan-x">
          <div className="relative h-full flex p-1 min-w-max">
          
            {/* Camada das Teclas Brancas */}
            <div className="flex h-full gap-0.5">
              {whiteNotes.map((note) => {
                const isActive = activeNotes?.has(note) || pressedNotes.has(note);
                return (
                  <button
                    key={note}
                    onMouseDown={(e) => { e.preventDefault(); startPlay(note); }}
                    onMouseUp={() => stopPlay(note)}
                    onMouseLeave={() => pressedNotes.has(note) && stopPlay(note)}
                    onTouchStart={(e) => { e.preventDefault(); startPlay(note); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopPlay(note); }}
                    className={`relative min-w-[48px] md:min-w-[60px] h-full rounded-b-lg transition-all duration-75 flex flex-col justify-end items-center pb-4 active:scale-95 touch-none ${
                      isActive 
                        ? "bg-gradient-to-b from-white to-cyan shadow-[0_0_20px_rgba(0,234,255,0.6)]" 
                        : "bg-gradient-to-b from-zinc-100 to-white hover:from-white hover:to-zinc-200"
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "text-white" : "text-zinc-400"}`}>
                      {midiNoteToName(note).replace(/\d/, "")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Camada das Teclas Pretas (Absolute Overlay) */}
            <div className="absolute top-0 left-0 h-[60%] pointer-events-none flex p-1">
              {whiteNotes.map((whiteNote) => {
                const blackNote = whiteNote + 1;
                const hasBlackNext = isBlackKey(blackNote) && blackNote <= endNote;
                
                if (!hasBlackNext) return <div key={`spacer-${whiteNote}`} className="min-w-[48px] md:min-w-[60px] mr-1" />;

                const isActive = activeNotes?.has(blackNote) || pressedNotes.has(blackNote);
                
                return (
                  <div key={`container-${blackNote}`} className="relative min-w-[48px] md:min-w-[60px] mr-1">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startPlay(blackNote); }}
                      onMouseUp={() => stopPlay(blackNote)}
                      onMouseLeave={() => pressedNotes.has(blackNote) && stopPlay(blackNote)}
                      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); startPlay(blackNote); }}
                      onTouchEnd={(e) => { e.preventDefault(); stopPlay(blackNote); }}
                      className={`absolute right-[-14px] md:right-[-18px] top-0 w-7 md:w-9 h-full rounded-b-md transition-all duration-75 pointer-events-auto z-10 active:scale-95 touch-none ${
                        isActive
                          ? "bg-gradient-to-b from-magenta to-purple-600 shadow-[0_0_15px_rgba(255,0,229,0.7)]"
                          : "bg-gradient-to-b from-zinc-800 to-zinc-950 border-x border-b border-white/10"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
      </div>
    </div>
  );
}
