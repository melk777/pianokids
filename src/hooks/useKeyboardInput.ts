"use client";

import { useEffect, useRef } from "react";

/**
 * Mapeamento QWERTY -> MIDI
 * Mid Row (White Keys): A=60 (C4), S=62, D=64, F=65, G=67, H=69, J=71, K=72 (C5)
 * Top Row (Black Keys): W=61 (C#4), E=63, T=66, Y=68, U=70
 */

interface KeyboardInputOptions {
  enabled?: boolean;
  onPlayNote?: (midi: number) => void;
  onReleaseNote?: (midi: number) => void;
}

const QWERTY_TO_MIDI: Record<string, number> = {
  KeyA: 60,
  KeyW: 61,
  KeyS: 62,
  KeyE: 63,
  KeyD: 64,
  KeyF: 65,
  KeyT: 66,
  KeyG: 67,
  KeyY: 68,
  KeyH: 69,
  KeyU: 70,
  KeyJ: 71,
  KeyK: 72,
  KeyO: 73,
  KeyL: 74,
  KeyP: 75,
  Semicolon: 76,
};

function shouldIgnoreKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function useKeyboardInput(options: KeyboardInputOptions = {}) {
  const { enabled = true, onPlayNote, onReleaseNote } = options;
  const pressedKeysRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !onPlayNote || !onReleaseNote) {
      pressedKeysRef.current.clear();
      return () => {};
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || shouldIgnoreKeyboardTarget(event.target)) return;

      const midi = QWERTY_TO_MIDI[event.code];
      if (!midi) return;

      event.preventDefault();
      pressedKeysRef.current.add(event.code);
      onPlayNote(midi);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const midi = QWERTY_TO_MIDI[event.code];
      if (!midi || !pressedKeysRef.current.has(event.code)) return;

      event.preventDefault();
      pressedKeysRef.current.delete(event.code);
      onReleaseNote(midi);
    };

    const releaseAll = () => {
      pressedKeysRef.current.forEach((code) => {
        const midi = QWERTY_TO_MIDI[code];
        if (midi) onReleaseNote(midi);
      });
      pressedKeysRef.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAll);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAll);
      releaseAll();
    };
  }, [enabled, onPlayNote, onReleaseNote]);
}
