import type { SongNote } from "@/lib/types";

/** Full 88-key range. */
export const FULL_RANGE = { start: 21, end: 108 } as const;

/**
 * Keyboard range for small screens: only the octaves the song uses, from a C
 * to a B, at least `minOctaves` wide, so keys stay large enough to tap.
 */
export function focusedKeyboardRange(notes: Pick<SongNote, "midi">[], minOctaves = 2) {
  if (notes.length === 0) return { start: 48, end: 83 }; // C3–B5

  let low = Infinity;
  let high = -Infinity;
  for (const note of notes) {
    low = Math.min(low, note.midi);
    high = Math.max(high, note.midi);
  }

  let start = Math.floor(low / 12) * 12; // down to a C
  let end = Math.floor(high / 12) * 12 + 11; // up to a B

  const minKeys = minOctaves * 12;
  while (end - start + 1 < minKeys) {
    // Grow toward middle C so a one-octave melody gets its neighbouring octave.
    if ((start + end) / 2 < 60) end += 12;
    else start -= 12;
  }

  start = Math.max(FULL_RANGE.start, start);
  end = Math.min(FULL_RANGE.end, end);
  return { start, end };
}
