"use client";

import { useEffect } from "react";

/**
 * Mapeamento QWERTY -> MIDI
 * Mid Row (White Keys): A=60 (C4), S=62, D=64, F=65, G=67, H=69, J=71, K=72 (C5)
 * Top Row (Black Keys): W=61 (C#4), E=63, T=66, Y=68, U=70
 */
const KEY_MAP: Record<string, number> = {
  // Teclas Brancas
  a: 60,
  s: 62,
  d: 64,
  f: 65,
  g: 67,
  h: 69,
  j: 71,
  k: 72,
  // Teclas Pretas
  w: 61,
  e: 63,
  t: 66,
  y: 68,
  u: 70,
};

interface UseKeyboardInputProps {
  onPlayNote: (midi: number) => void;
  onReleaseNote?: (midi: number) => void;
  disabled?: boolean;
}

export function useKeyboardInput({ onPlayNote, onReleaseNote, disabled }: UseKeyboardInputProps) {
  useEffect(() => {
    // Teclado do PC (QWERTY) desativado conforme solicitado para focar no piano real/toque.
    return () => {};
  }, []);
}
