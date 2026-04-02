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

// Mapeamento visual das teclas físicas do PC para as notas musicais
const MIDI_TO_KEY: Record<number, string> = {
  60: "A", 62: "S", 64: "D", 65: "F", 67: "G", 69: "H", 71: "J", 72: "K", // Brancas
  61: "W", 63: "E", 66: "T", 68: "Y", 70: "U" // Pretas
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
    <div className={`relative w-full h-full select-none ${className}`}>
      <div className="relative h-full flex min-w-max p-0">
          
        {/* Camada das Teclas Brancas */}
        <div className="flex h-full gap-0">
          {whiteNotes.map((note) => {
            const isActive = activeNotes?.has(note) || pressedNotes.has(note);
            const physicalKey = MIDI_TO_KEY[note];
            
            return (
              <button
                key={note}
                onMouseDown={(e) => { e.preventDefault(); startPlay(note); }}
                onMouseUp={() => stopPlay(note)}
                onMouseLeave={() => pressedNotes.has(note) && stopPlay(note)}
                onTouchStart={(e) => { e.preventDefault(); startPlay(note); }}
                onTouchEnd={(e) => { e.preventDefault(); stopPlay(note); }}
                className={`relative w-[60px] h-full rounded-b-lg border-x border-black/5 transition-all duration-75 flex flex-col justify-end items-center pb-6 active:scale-95 touch-none ${
                  isActive 
                    ? "bg-gradient-to-b from-white to-cyan shadow-[0_0_20px_rgba(0,234,255,0.6)]" 
                    : "bg-gradient-to-b from-white to-zinc-100 hover:from-white hover:to-zinc-200"
                }`}
              >
                {/* Indicador de Tecla Física (Desktop Only Hint) */}
                {physicalKey && (
                  <div className={`mb-2 w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border transition-colors ${
                    isActive ? "bg-white/20 border-white/40 text-white" : "bg-zinc-200/50 border-zinc-300 text-zinc-500"
                  }`}>
                    {physicalKey}
                  </div>
                )}
                
                <span className={`text-[12px] font-black uppercase tracking-tighter ${isActive ? "text-white" : "text-zinc-600"}`}>
                  {midiNoteToName(note).replace(/\d/, "")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Camada das Teclas Pretas (Absolute Overlay) */}
        <div className="absolute top-0 left-0 h-[60%] pointer-events-none flex p-0">
          {whiteNotes.map((whiteNote) => {
            const blackNote = whiteNote + 1;
            const hasBlackNext = isBlackKey(blackNote) && blackNote <= endNote;
            
            if (!hasBlackNext) return <div key={`spacer-${whiteNote}`} className="w-[60px]" />;

            const isActive = activeNotes?.has(blackNote) || pressedNotes.has(blackNote);
            const physicalKey = MIDI_TO_KEY[blackNote];
            
            return (
              <div key={`container-${blackNote}`} className="relative w-[60px]">
                <button
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startPlay(blackNote); }}
                  onMouseUp={() => stopPlay(blackNote)}
                  onMouseLeave={() => pressedNotes.has(blackNote) && stopPlay(blackNote)}
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); startPlay(blackNote); }}
                  onTouchEnd={(e) => { e.preventDefault(); stopPlay(blackNote); }}
                  className={`absolute right-[-20px] top-0 w-10 h-full rounded-b-md transition-all duration-75 pointer-events-auto z-10 active:scale-95 touch-none flex flex-col items-center justify-end pb-4 ${
                    isActive
                      ? "bg-gradient-to-b from-magenta to-purple-600 shadow-[0_0_15px_rgba(255,0,229,0.7)]"
                      : "bg-gradient-to-b from-zinc-800 to-black border-x border-b border-white/20 shadow-xl"
                  }`}
                >
                  {/* Indicador de Tecla Física (Preta) */}
                  {physicalKey && (
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black border transition-colors ${
                      isActive ? "bg-white/20 border-white/40 text-white" : "bg-black/50 border-white/10 text-white/40"
                    }`}>
                      {physicalKey}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

