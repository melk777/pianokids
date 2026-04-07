"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { midiNoteToName, isBlackKey } from "@/hooks/useMIDI";

interface MockNote {
  id: string;
  note: number;
  length: number; // Altura visual (duração)
  position: number; // Distância do topo
  hand: "left" | "right";
}

export default function PianoGameLayout() {
  // Configurações do teclado (C3 a C5 para o mockup)
  const startNote = 48;
  const endNote = 72;
  
  const notesRange: number[] = useMemo(() => {
    const arr = [];
    for (let i = startNote; i <= endNote; i++) arr.push(i);
    return arr;
  }, []);

  const whiteNotes = notesRange.filter((n) => !isBlackKey(n));
  const whiteKeyWidth = 100 / whiteNotes.length;

  // Mock de notas caindo (Waterfall)
  const fallingNotes: MockNote[] = [
    { id: "1", note: 48, length: 120, position: 50, hand: "left" },   // C3 longo
    { id: "2", note: 52, length: 60, position: 150, hand: "right" }, // E3 curto
    { id: "3", note: 55, length: 80, position: 220, hand: "right" }, // G3 médio
    { id: "4", note: 60, length: 200, position: -50, hand: "left" }, // C4 vindo do topo
    { id: "5", note: 64, length: 40, position: 300, hand: "right" }, // E4 curtinha
  ];

  // Helper para posicionar as notas na "pista" correta
  const getNoteX = (note: number) => {
    if (isBlackKey(note)) {
      const prevWhite = note - 1;
      const idx = whiteNotes.indexOf(prevWhite);
      return (idx + 1) * whiteKeyWidth - (whiteKeyWidth * 0.35);
    }
    const idx = whiteNotes.indexOf(note);
    return idx * whiteKeyWidth;
  };

  const getNoteWidth = (note: number) => {
    return isBlackKey(note) ? whiteKeyWidth * 0.7 : whiteKeyWidth;
  };

  return (
    <div className="fixed inset-0 w-full h-screen bg-slate-950 flex flex-col overflow-hidden font-sans select-none">
      
      {/* ── 1. ÁREA DE JOGO (WATERFALL) ────────────────────────────────────────── */}
      <div className="relative flex-1 w-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]">
        {/* Camada de Gradiente de Profundidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

        {/* Linhas das "Pistas" das Teclas (Sutil) */}
        <div className="absolute inset-0 flex pointer-events-none opacity-10">
          {whiteNotes.map((_, i) => (
            <div 
              key={i} 
              className="h-full border-r border-white/20" 
              style={{ width: `${whiteKeyWidth}%` }}
            />
          ))}
        </div>

        {/* NOTAS CAINDO (MOCK) */}
        <div className="absolute inset-0">
          {fallingNotes.map((item) => {
            const isLeft = item.hand === "left";
            const noteName = midiNoteToName(item.note).replace(/\d/, "");
            
            return (
              <motion.div
                key={item.id}
                className={`absolute rounded-lg border-2 flex items-center justify-center shadow-lg
                  ${isLeft 
                    ? "bg-emerald-500/80 border-emerald-400 shadow-emerald-500/20" 
                    : "bg-amber-500/80 border-amber-400 shadow-amber-500/20"
                  }`}
                style={{
                  left: `${getNoteX(item.note)}%`,
                  top: `${item.position}px`,
                  width: `${getNoteWidth(item.note)}%`,
                  height: `${item.length}px`,
                  zIndex: isBlackKey(item.note) ? 10 : 5,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-white font-bold text-xs md:text-sm drop-shadow-md">
                  {noteName}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 2. LINHA DE ACERTO (HIT LINE) ───────────────────────────────────────── */}
      <div className="relative h-1 w-full z-20">
        {/* Glow de fundo na zona de acerto */}
        <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-t from-cyan/20 to-transparent" />
        
        {/* Linha Neon */}
        <div className="absolute inset-0 bg-cyan shadow-[0_0_20px_rgba(0,234,255,0.8),0_0_40px_rgba(0,234,255,0.4)]" />
      </div>

      {/* ── 3. ÁREA DO TECLADO ──────────────────────────────────────────────────── */}
      <div className="relative h-[25%] min-h-[160px] w-full bg-slate-900 border-t border-white/10 px-0.5">
        <div className="relative h-full w-full flex items-start">
          
          {/* Teclas Brancas */}
          {whiteNotes.map((note) => {
            const isPressed = note === 48; // Simulação: C3 pressionado
            return (
              <div
                key={note}
                className={`relative flex-1 h-[95%] border-x border-slate-800 rounded-b-md transition-all duration-100
                  ${isPressed 
                    ? "bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[inset_0_-8px_15px_rgba(0,0,0,0.3)] translate-y-1" 
                    : "bg-white shadow-[inset_0_-6px_0_rgba(0,0,0,0.1)] hover:bg-slate-50"
                  }`}
                style={{ width: `${whiteKeyWidth}%` }}
              >
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className={`text-[10px] font-bold ${isPressed ? "text-white" : "text-slate-400"}`}>
                    {midiNoteToName(note).replace(/\d/, "")}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Teclas Pretas */}
          {notesRange.map((note) => {
            if (!isBlackKey(note)) return null;
            const isPressed = note === 61; // Simulação: C#4 pressionado
            
            return (
              <div
                key={note}
                className={`absolute h-[60%] z-30 border border-slate-950 rounded-b-sm transition-all duration-100
                  ${isPressed 
                    ? "bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_4px_10px_rgba(0,0,0,0.5)] translate-y-0.5" 
                    : "bg-slate-950 shadow-[0_6px_0_rgba(0,0,0,0.4)]"
                  }`}
                style={{
                  left: `${getNoteX(note)}%`,
                  width: `${getNoteWidth(note)}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Overlay de HUD (Mockup) */}
      <div className="absolute top-6 left-6 z-50">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Pontuação</div>
          <div className="text-gradient font-black text-3xl font-mono">000.450</div>
        </div>
      </div>
      
      <div className="absolute top-6 right-6 z-50">
        <div className="flex gap-2">
          <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
            Combo x5
          </div>
        </div>
      </div>

    </div>
  );
}
