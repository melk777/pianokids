"use client";

import { useEffect } from "react";

/**
 * Mapeamento QWERTY -> MIDI
 * Mid Row (White Keys): A=60 (C4), S=62, D=64, F=65, G=67, H=69, J=71, K=72 (C5)
 * Top Row (Black Keys): W=61 (C#4), E=63, T=66, Y=68, U=70
 */

export function useKeyboardInput() {
  useEffect(() => {
    // Teclado do PC (QWERTY) desativado conforme solicitado para focar no piano real/toque.
    return () => {};
  }, []);
}
