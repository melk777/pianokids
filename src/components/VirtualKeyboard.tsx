"use client";

import React from "react";
import { type MIDINote } from "@/hooks/useMIDI";

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

  return (
    <div className={`relative flex justify-center w-full h-full select-none p-1 bg-zinc-950/40 backdrop-blur-sm rounded-b-2xl border-t border-white/10 ${className}`}>
      {/* Camada das Teclas Brancas */}
      <div className="flex w-full h-full gap-1">
        {whiteNotes.map((note) => {
          const isActive = activeNotes?.has(note);
          return (
            <button
              key={note}
              onMouseDown={() => onPlayNote(note)}
              onMouseUp={() => onReleaseNote(note)}
              onMouseLeave={() => onReleaseNote(note)}
              onTouchStart={(e) => { e.preventDefault(); onPlayNote(note); }}
              onTouchEnd={() => onReleaseNote(note)}
              className={`
                flex-1 relative rounded-b-xl border-x border-b border-white/10 transition-all duration-75
                ${isActive ? "bg-cyan shadow-[0_0_20px_rgba(0,234,255,0.4)] translate-y-1" : "bg-zinc-900 hover:bg-zinc-800"}
              `}
            >
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/20 uppercase">
                {note === 60 ? "C4" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Camada das Teclas Pretas (Posicionamento Absoluto) */}
      <div className="absolute inset-x-4 top-4 h-40 pointer-events-none flex">
        {/* Usamos a mesma lógica de largura das brancas para alinhar */}
        {whiteNotes.map((whiteNote) => {
          // Notas pretas aparecem após C, D, F, G, A
          const hasBlackKeyAfter = [0, 2, 5, 7, 9].includes(whiteNote % 12);
          const blackNote = whiteNote + 1;

          if (!hasBlackKeyAfter || blackNote > endNote) return <div key={`spacer-${whiteNote}`} className="flex-1" />;

          const isActive = activeNotes?.has(blackNote);

          return (
            <div key={`container-${whiteNote}`} className="flex-1 relative">
              <button
                onMouseDown={() => onPlayNote(blackNote)}
                onMouseUp={() => onReleaseNote(blackNote)}
                onMouseLeave={() => onReleaseNote(blackNote)}
                onTouchStart={(e) => { e.preventDefault(); onPlayNote(blackNote); }}
                onTouchEnd={() => onReleaseNote(blackNote)}
                className={`
                  absolute right-0 translate-x-1/2 w-8 h-full rounded-b-lg border border-white/5 z-20 pointer-events-auto transition-all duration-75
                  ${isActive ? "bg-magenta shadow-[0_0_20px_rgba(255,0,229,0.4)] scale-95" : "bg-black hover:bg-zinc-900"}
                `}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
