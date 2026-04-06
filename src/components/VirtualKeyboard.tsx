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
      <div className="relative h-full flex min-w-max p-0 bg-zinc-900 border-t-4 border-black shadow-inner">
          
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
                className={`relative w-[60px] h-full rounded-b-xl border-x border-zinc-200/50 transition-all duration-75 flex flex-col justify-end items-center pb-8 active:translate-y-1 touch-none group ${
                  isActive 
                    ? "bg-gradient-to-b from-zinc-100 to-cyan shadow-[inset_0_-8px_15px_rgba(0,234,255,0.4),0_10px_20px_rgba(0,0,0,0.4)] translate-y-1" 
                    : "bg-gradient-to-b from-white via-zinc-50 to-zinc-200 shadow-[inset_0_-4px_0_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.2)] hover:to-zinc-300"
                }`}
                style={{ zIndex: 1 }}
              >
                {/* Ativity Glow on top */}
                {isActive && <div className="absolute top-0 left-0 right-0 h-1 bg-cyan shadow-[0_4px_12px_rgba(0,234,255,0.8)] z-20" />}

                {/* Physical Key indicator */}
                {physicalKey && (
                  <div className={`mb-3 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border transition-colors ${
                    isActive ? "bg-white/30 border-white/50 text-white" : "bg-zinc-100 border-zinc-300 text-zinc-400 group-hover:text-zinc-500"
                  }`}>
                    {physicalKey}
                  </div>
                )}
                
                <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? "text-white" : "text-zinc-400"}`}>
                  {midiNoteToName(note).replace(/\d/, "")}
                </span>
                
                {/* 3D Reflection bevel on bottom */}
                {!isActive && <div className="absolute bottom-1 left-1 right-1 h-[2px] bg-white/60 rounded-full blur-[1px]" />}
              </button>
            );
          })}
        </div>

        {/* Camada das Teclas Pretas (Absolute Overlay) */}
        <div className="absolute top-0 left-0 h-[62%] pointer-events-none flex p-0">
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
                  className={`absolute right-[-22px] top-0 w-11 h-full rounded-b-lg transition-all duration-75 pointer-events-auto z-10 touch-none flex flex-col items-center justify-end pb-5 shadow-2xl ${
                    isActive
                      ? "bg-gradient-to-b from-zinc-800 to-magenta shadow-[inset_0_-6px_10px_rgba(255,0,229,0.5),0_8px_15px_rgba(0,0,0,0.5)] translate-y-1"
                      : "bg-gradient-to-br from-zinc-700 via-zinc-800 to-black border-x border-b border-white/10 shadow-[inset_0_-3px_0_rgba(255,255,255,0.05),0_10px_10px_rgba(0,0,0,0.6)] hover:brightness-125"
                  }`}
                >
                   {/* Ativity Glow on top (Black Keys) */}
                   {isActive && <div className="absolute top-0 left-0 right-0 h-1 bg-magenta shadow-[0_4px_10px_rgba(255,0,229,0.8)] z-20" />}

                  {/* Reflection highlights */}
                  {!isActive && <div className="absolute top-[2px] left-[4px] right-[4px] h-[4px] bg-white/5 rounded-full" />}
                  
                  {physicalKey && (
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold border transition-colors ${
                      isActive ? "bg-white/20 border-white/30 text-white" : "bg-black/40 border-white/5 text-white/30"
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

