"use client";

import React, { useState } from "react";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import VirtualKeyboard from "./VirtualKeyboard";

/**
 * PianoEngine - Dispatcher Central
 * Unifica as entradas QWERTY e Virtual Keyboard
 */
export default function PianoEngine() {
  // Estado para feedback visual de notas ativas
  const [activeNotes, setActiveNotes] = useState<Map<number, boolean>>(new Map());

  // 1. Fonte da Verdade: playNote
  const playNote = (midiNote: number) => {
    setActiveNotes((prev) => {
      const next = new Map(prev);
      next.set(midiNote, true);
      return next;
    });

    // Log elegante solicitado pelo usuário
    console.log(`%c🎵 Nota tocada: ${midiNote}`, "color: #00EAFF; font-weight: bold; font-size: 14px;");
    
    // Futuramente aqui chamaremos o sintetizador de áudio real
  };

  const releaseNote = (midiNote: number) => {
    setActiveNotes((prev) => {
      const next = new Map(prev);
      next.delete(midiNote);
      return next;
    });
    
    console.log(`%c🛑 Nota solta: ${midiNote}`, "color: #FF00E5; font-style: italic; font-size: 12px;");
  };

  // 2. Conexão com o QWERTY Listener (Hook)
  useKeyboardInput({
    onPlayNote: playNote,
    onReleaseNote: releaseNote,
  });

  return (
    <div className="w-full flex flex-col items-center gap-8 py-10 bg-black min-h-[400px]">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2 font-geist-sans tracking-tight">
          Teclado <span className="text-gradient font-black">Híbrido</span> Mágico
        </h2>
        <p className="text-white/40 text-sm max-w-md">
          Toque clicando com o mouse, usando o QWERTY (fileiras A-K e W-U) ou o seu teclado físico MIDI.
        </p>
      </div>

      {/* 3. Conexão com o Virtual Keyboard (UI) */}
      <VirtualKeyboard
        onPlayNote={playNote}
        onReleaseNote={releaseNote}
        activeNotes={activeNotes}
      />

      <div className="flex gap-4 mt-4">
        <div className="text-[10px] text-white/20 border border-white/10 px-3 py-1 rounded-full uppercase tracking-tighter">
          Modo Híbrido: Ativo
        </div>
        <div className="text-[10px] text-emerald-400/50 border border-emerald-400/20 px-3 py-1 rounded-full uppercase tracking-tighter animate-pulse">
          Aguardando MIDI Externo...
        </div>
      </div>
    </div>
  );
}
