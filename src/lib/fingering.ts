import type { SongNote } from "@/lib/types";

/**
 * Suggested piano fingering (1 = thumb … 5 = little finger).
 *
 * Each hand is solved independently with a small dynamic program over the
 * melodic line, scoring the classic rules a teacher applies:
 * - neighbouring fingers cover roughly two semitones each;
 * - crossing is only natural as thumb-under (ascending, right hand) or
 *   finger-over-thumb (descending, right hand), mirrored for the left hand;
 * - the thumb avoids black keys;
 * - repeated notes keep the same finger.
 * Chords get a spread fingering from their outer notes and anchor the line.
 *
 * It is a suggestion generated automatically, not an editor-reviewed score.
 */

export type Finger = 1 | 2 | 3 | 4 | 5;

const FINGERS: Finger[] = [1, 2, 3, 4, 5];
const CHORD_WINDOW = 0.09;
const SEMITONES_PER_FINGER = 2;
const LARGE_LEAP = 9;
const IMPOSSIBLE = 1_000;

const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);

export function resolveHand(note: Pick<SongNote, "hand" | "midi">): "left" | "right" {
  return note.hand ?? (note.midi >= 60 ? "right" : "left");
}

interface Group {
  time: number;
  indices: number[];
}

function groupByOnset(indices: number[], notes: SongNote[]): Group[] {
  const sorted = [...indices].sort((a, b) => notes[a].time - notes[b].time || notes[a].midi - notes[b].midi);
  const groups: Group[] = [];
  for (const index of sorted) {
    const previous = groups[groups.length - 1];
    if (previous && Math.abs(notes[index].time - previous.time) <= CHORD_WINDOW) {
      previous.indices.push(index);
    } else {
      groups.push({ time: notes[index].time, indices: [index] });
    }
  }
  return groups;
}

/** Fingers for a chord, from the lowest to the highest note. */
export function chordFingering(midis: number[], hand: "left" | "right"): Finger[] {
  const sorted = [...midis].sort((a, b) => a - b);
  const count = Math.min(sorted.length, 5);
  if (count === 1) return [hand === "right" ? 1 : 5];

  const span = sorted[count - 1] - sorted[0];
  // Wide chords use the whole hand; narrow ones stay on neighbouring fingers.
  const reach = Math.max(count, Math.min(5, Math.round(span / SEMITONES_PER_FINGER) + 1));
  const result: Finger[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i >= 5) {
      result.push(5);
      continue;
    }
    const position = span === 0 ? i : (sorted[i] - sorted[0]) / span;
    let finger = 1 + Math.round(position * (reach - 1));
    const previous = result[i - 1] ?? 0;
    finger = Math.max(finger, previous + 1);
    finger = Math.min(finger, 5 - (count - 1 - i));
    result.push(finger as Finger);
  }

  // Fingers above are ordered thumb→little for the right hand. The left hand
  // plays the lowest note with the little finger, so mirror it.
  return hand === "right" ? result : (result.map((f) => (6 - f) as Finger));
}

function transitionCost(from: number, fromFinger: Finger, to: number, toFinger: Finger, hand: "left" | "right") {
  // Mirror the left hand so "ascending" always means "away from the thumb".
  const interval = hand === "right" ? to - from : from - to;

  if (interval === 0) return fromFinger === toFinger ? 0 : 1.5;

  if (Math.abs(interval) >= LARGE_LEAP) {
    // The hand moves to a new position; any finger works, prefer a natural
    // landing (thumb going up, little finger going down) and avoid tension.
    const landing = interval > 0 ? toFinger - 1 : 5 - toFinger;
    return 3 + landing * 0.4;
  }

  const fingerStep = toFinger - fromFinger;
  if (interval > 0 && fingerStep <= 0) {
    // Ascending with a lower finger: only the thumb can pass under.
    if (toFinger === 1 && fromFinger >= 2 && fromFinger <= 4 && interval <= 5) return 2 + interval * 0.2;
    return IMPOSSIBLE;
  }
  if (interval < 0 && fingerStep >= 0) {
    // Descending with a higher finger: only a finger can cross over the thumb.
    if (fromFinger === 1 && toFinger >= 2 && toFinger <= 4 && -interval <= 5) return 2 + -interval * 0.2;
    return IMPOSSIBLE;
  }

  const natural = fingerStep * SEMITONES_PER_FINGER;
  const stretch = Math.abs(interval - natural);
  // Stretching wider than the fingers comfortably reach is worse than cramping.
  return Math.abs(interval) > Math.abs(natural) ? stretch * 0.9 : stretch * 0.6;
}

function placementCost(midi: number, finger: Finger) {
  if (finger === 1 && isBlackKey(midi)) return 2.5;
  if (finger === 5 && isBlackKey(midi)) return 0.8;
  return 0;
}

function solveHand(indices: number[], notes: SongNote[], hand: "left" | "right", result: (Finger | null)[]) {
  const groups = groupByOnset(indices, notes);
  if (groups.length === 0) return;

  // For each group, the note that carries the melodic line (top for the right
  // hand, bottom for the left) and the fingers it may take.
  const line = groups.map((group) => {
    const midis = group.indices.map((index) => notes[index].midi);
    if (group.indices.length === 1) {
      return { midi: midis[0], allowed: FINGERS, chord: null as null | Finger[] };
    }
    const chord = chordFingering(midis, hand);
    const sortedIndices = [...group.indices].sort((a, b) => notes[a].midi - notes[b].midi);
    sortedIndices.forEach((index, position) => {
      result[index] = chord[position];
    });
    const anchorPosition = hand === "right" ? sortedIndices.length - 1 : 0;
    return {
      midi: notes[sortedIndices[anchorPosition]].midi,
      allowed: [chord[anchorPosition]] as Finger[],
      chord,
    };
  });

  // Viterbi over the line.
  const costs: number[][] = [];
  const back: number[][] = [];
  line.forEach((step, stepIndex) => {
    costs.push(new Array(5).fill(Infinity));
    back.push(new Array(5).fill(-1));
    for (const finger of step.allowed) {
      const own = placementCost(step.midi, finger);
      if (stepIndex === 0) {
        costs[0][finger - 1] = own;
        continue;
      }
      const previous = line[stepIndex - 1];
      for (const prevFinger of previous.allowed) {
        const base = costs[stepIndex - 1][prevFinger - 1];
        if (!Number.isFinite(base)) continue;
        const total = base + own + transitionCost(previous.midi, prevFinger, step.midi, finger, hand);
        if (total < costs[stepIndex][finger - 1]) {
          costs[stepIndex][finger - 1] = total;
          back[stepIndex][finger - 1] = prevFinger - 1;
        }
      }
    }
  });

  let finger = costs[line.length - 1].indexOf(Math.min(...costs[line.length - 1]));
  for (let stepIndex = line.length - 1; stepIndex >= 0; stepIndex--) {
    if (!line[stepIndex].chord) {
      result[groups[stepIndex].indices[0]] = (finger + 1) as Finger;
    }
    finger = back[stepIndex][finger];
    if (finger < 0 && stepIndex > 0) {
      // Every path was blocked (should not happen); restart from the cheapest.
      const previousCosts = costs[stepIndex - 1];
      finger = previousCosts.indexOf(Math.min(...previousCosts));
    }
  }
}

/** Suggested finger for each note, aligned with the input array. */
export function suggestFingering(notes: SongNote[]): (Finger | null)[] {
  const result: (Finger | null)[] = notes.map(() => null);
  const byHand = { left: [] as number[], right: [] as number[] };
  notes.forEach((note, index) => byHand[resolveHand(note)].push(index));
  solveHand(byHand.right, notes, "right", result);
  solveHand(byHand.left, notes, "left", result);
  return result;
}
