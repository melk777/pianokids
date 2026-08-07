"use client";

import { memo, useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import type { MIDINote } from "@/hooks/useMIDI";
import { midiNoteToName } from "@/hooks/useMIDI";
import { PIANO_END_MIDI, PIANO_START_MIDI } from "@/lib/pianoRange";

interface VirtualKeyboardProps {
  onPlayNote: (midi: number) => void;
  onReleaseNote: (midi: number) => void;
  activeNotes?: Map<number, MIDINote | boolean>;
  className?: string;
  startNote?: number;
  endNote?: number;
  highlightedNote?: number;
}

interface KeyProps {
  note: number;
  isActiveProp: boolean;
  isHighlighted: boolean;
  onPlayNote: (midi: number) => void;
  onReleaseNote: (midi: number) => void;
  leftPosition?: number;
  whiteKeyWidthPercent?: number;
}

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

function isBlackKey(midi: number) {
  return BLACK_PITCH_CLASSES.has(midi % 12);
}

function useKeyInteraction(note: number, onPlayNote: (midi: number) => void, onReleaseNote: (midi: number) => void) {
  const [isPressed, setIsPressed] = useState(false);
  const isPressedRef = useRef(false);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      if (isPressedRef.current) return;
      isPressedRef.current = true;
      setIsPressed(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      onPlayNote(note);
    },
    [note, onPlayNote],
  );

  const release = useCallback(
    (event?: PointerEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      if (!isPressedRef.current) return;
      isPressedRef.current = false;
      setIsPressed(false);
      onReleaseNote(note);
    },
    [note, onReleaseNote],
  );

  const handlePointerLeave = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse") release(event);
    },
    [release],
  );

  return { isPressed, handlePointerDown, release, handlePointerLeave };
}

const WhiteKey = memo(function WhiteKey({ note, isActiveProp, isHighlighted, onPlayNote, onReleaseNote }: KeyProps) {
  const noteName = midiNoteToName(note);
  const isRightHand = note >= 60;
  const isOctaveMarker = note % 12 === 0;
  const isMiddleC = note === 60;
  const { isPressed, handlePointerDown, release, handlePointerLeave } = useKeyInteraction(note, onPlayNote, onReleaseNote);
  const isActive = isActiveProp || isPressed;
  const glow = isRightHand ? "rgba(250, 204, 21, 0.62)" : "rgba(52, 211, 153, 0.6)";

  return (
    <button
      type="button"
      aria-label={`Tocar ${noteName}${isHighlighted ? ", tecla destacada pelo tutorial" : ""}`}
      aria-pressed={isActive}
      data-testid={`virtual-key-${noteName}`}
      data-midi={note}
      data-tutorial-highlight={isHighlighted ? "true" : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={handlePointerLeave}
      className={`group relative flex h-full min-w-0 flex-1 touch-none select-none flex-col items-center justify-end overflow-hidden border-l border-zinc-400/35 pb-2 transition-[transform,filter,background-color] duration-75 first:border-l-0 focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/80 md:pb-3 ${
        isActive
          ? isRightHand
            ? "translate-y-[3px] bg-gradient-to-b from-white via-amber-100 to-amber-400"
            : "translate-y-[3px] bg-gradient-to-b from-white via-emerald-50 to-emerald-400"
          : isHighlighted
            ? "z-10 bg-gradient-to-b from-cyan-50 via-cyan-200 to-cyan-500 ring-2 ring-inset ring-cyan-300"
          : "bg-gradient-to-b from-white via-zinc-50 to-zinc-300 hover:brightness-105"
      }`}
      style={{
        boxShadow: isActive
          ? `inset 0 -12px 20px ${glow}, 0 0 22px ${glow}`
          : isHighlighted
            ? "inset 0 -16px 24px rgba(6,182,212,0.72), 0 0 30px rgba(34,211,238,0.95), 0 0 0 2px rgba(255,255,255,0.72)"
          : "inset 0 -9px 14px rgba(24,24,27,0.13), inset -1px 0 0 rgba(255,255,255,0.7)",
      }}
    >
      <span aria-hidden className="absolute inset-x-[12%] top-0 h-[5%] rounded-b-full bg-zinc-300/55 shadow-sm" />
      <span aria-hidden className="absolute inset-x-[18%] bottom-[8%] h-px bg-white/80" />
      {isActive || isHighlighted ? (
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-1 ${
            isHighlighted && !isActive ? "bg-cyan-300 motion-safe:animate-pulse" : isRightHand ? "bg-amber-300" : "bg-emerald-300"
          }`}
          style={{ boxShadow: `0 2px 14px ${isHighlighted && !isActive ? "rgba(34,211,238,0.95)" : glow}` }}
        />
      ) : null}
      {isHighlighted && !isActive ? (
        <span className="relative z-10 mb-1 rounded-full bg-zinc-950 px-1.5 py-0.5 font-mono text-[8px] font-black tracking-[0.08em] text-cyan shadow-[0_0_14px_rgba(34,211,238,0.9)] md:text-[10px]">
          C4
        </span>
      ) : isOctaveMarker ? (
        <span
          className={`relative z-10 font-mono text-[7px] font-black tracking-tight md:text-[9px] ${
            isActive ? "text-zinc-900" : isMiddleC ? "text-cyan-700" : "text-zinc-500/80"
          }`}
        >
          {noteName}
        </span>
      ) : null}
      {isMiddleC ? (
        <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
      ) : null}
    </button>
  );
});

const BlackKey = memo(function BlackKey({
  note,
  isActiveProp,
  isHighlighted,
  onPlayNote,
  onReleaseNote,
  leftPosition,
  whiteKeyWidthPercent,
}: KeyProps) {
  const noteName = midiNoteToName(note);
  const isRightHand = note >= 60;
  const { isPressed, handlePointerDown, release, handlePointerLeave } = useKeyInteraction(note, onPlayNote, onReleaseNote);
  const isActive = isActiveProp || isPressed;
  const glow = isRightHand ? "rgba(250, 204, 21, 0.72)" : "rgba(52, 211, 153, 0.7)";

  return (
    <button
      type="button"
      aria-label={`Tocar ${noteName}${isHighlighted ? ", tecla destacada pelo tutorial" : ""}`}
      aria-pressed={isActive}
      data-testid={`virtual-key-${noteName}`}
      data-midi={note}
      data-tutorial-highlight={isHighlighted ? "true" : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={handlePointerLeave}
      className={`pointer-events-auto absolute top-0 z-20 flex h-full touch-none select-none items-start justify-center overflow-hidden rounded-b-[clamp(3px,0.55vw,8px)] border-x border-b pt-1 transition-[transform,filter,background-color] duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/80 ${
        isActive
          ? isRightHand
            ? "translate-y-[3px] border-amber-200/50 bg-gradient-to-br from-zinc-700 via-amber-700 to-amber-950"
            : "translate-y-[3px] border-emerald-200/50 bg-gradient-to-br from-zinc-700 via-emerald-700 to-emerald-950"
          : isHighlighted
            ? "border-cyan-100 bg-gradient-to-b from-cyan-300 via-cyan-600 to-cyan-950"
          : "border-white/10 bg-gradient-to-br from-zinc-700 via-zinc-900 to-black hover:brightness-125"
      }`}
      style={{
        left: `${leftPosition}%`,
        transform: `translateX(-50%) ${isActive ? "translateY(3px)" : ""}`,
        width: `${(whiteKeyWidthPercent ?? 0) * 0.64}%`,
        boxShadow: isActive
          ? `inset 0 -8px 12px ${glow}, 0 7px 15px rgba(0,0,0,0.72), 0 0 18px ${glow}`
          : isHighlighted
            ? "inset 0 -8px 12px rgba(34,211,238,0.72), 0 7px 15px rgba(0,0,0,0.72), 0 0 24px rgba(34,211,238,0.95)"
          : "inset 0 -8px 12px rgba(0,0,0,0.85), inset 2px 0 3px rgba(255,255,255,0.10), 0 8px 12px rgba(0,0,0,0.72)",
      }}
    >
      <span aria-hidden className="absolute inset-x-[18%] top-[5%] h-[7%] rounded-full bg-white/10 blur-[0.4px]" />
      <span aria-hidden className="absolute bottom-0 left-[14%] top-[18%] w-px bg-white/[0.07]" />
      {isActive || isHighlighted ? <span className="font-mono text-[7px] font-black text-white/90 md:text-[8px]">{noteName}</span> : null}
    </button>
  );
});

export default function VirtualKeyboard({
  onPlayNote,
  onReleaseNote,
  activeNotes,
  className,
  startNote = PIANO_START_MIDI,
  endNote = PIANO_END_MIDI,
  highlightedNote,
}: VirtualKeyboardProps) {
  const notes = useMemo(() => Array.from({ length: endNote - startNote + 1 }, (_, index) => startNote + index), [endNote, startNote]);
  const whiteNotes = useMemo(() => notes.filter((note) => !isBlackKey(note)), [notes]);
  const whiteKeyWidthPercent = 100 / whiteNotes.length;

  return (
    <div
      role="group"
      aria-label={`Teclado virtual de ${notes.length} teclas, de ${midiNoteToName(startNote)} a ${midiNoteToName(endNote)}`}
      className={`relative h-full w-full select-none overflow-hidden bg-zinc-950 pt-[clamp(7px,1.2vh,13px)] ${className ?? ""}`}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[clamp(7px,1.2vh,13px)] bg-gradient-to-b from-zinc-700 via-zinc-950 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_3px_10px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-emerald-400/30 via-cyan/45 to-amber-300/30 shadow-[0_0_12px_rgba(34,211,238,0.35)]" />
      </div>

      <div className="relative flex h-full w-full bg-zinc-900">
        {whiteNotes.map((note) => (
          <WhiteKey
            key={`white-${note}`}
            note={note}
            isActiveProp={Boolean(activeNotes?.has(note))}
            isHighlighted={highlightedNote === note}
            onPlayNote={onPlayNote}
            onReleaseNote={onReleaseNote}
          />
        ))}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[64%]">
          {whiteNotes.map((whiteNote, index) => {
            const blackNote = whiteNote + 1;
            if (!isBlackKey(blackNote) || blackNote > endNote) return null;

            return (
              <BlackKey
                key={`black-${blackNote}`}
                note={blackNote}
                isActiveProp={Boolean(activeNotes?.has(blackNote))}
                isHighlighted={highlightedNote === blackNote}
                onPlayNote={onPlayNote}
                onReleaseNote={onReleaseNote}
                leftPosition={(index + 1) * whiteKeyWidthPercent}
                whiteKeyWidthPercent={whiteKeyWidthPercent}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
