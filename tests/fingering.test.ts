import assert from "node:assert/strict";
import test from "node:test";

import { chordFingering, suggestFingering } from "../src/lib/fingering.ts";

const melody = (midis: number[], hand: "left" | "right", step = 0.5) =>
  midis.map((midi, index) => ({ midi, time: index * step, duration: step, hand }));

test("right hand C major scale uses the standard thumb-under fingering", () => {
  const up = suggestFingering(melody([60, 62, 64, 65, 67, 69, 71, 72], "right"));
  assert.deepEqual(up, [1, 2, 3, 1, 2, 3, 4, 5]);

  const down = suggestFingering(melody([72, 71, 69, 67, 65, 64, 62, 60], "right"));
  assert.deepEqual(down, [5, 4, 3, 2, 1, 3, 2, 1]);
});

test("left hand C major scale mirrors the right hand", () => {
  const up = suggestFingering(melody([48, 50, 52, 53, 55, 57, 59, 60], "left"));
  assert.deepEqual(up, [5, 4, 3, 2, 1, 3, 2, 1]);
});

test("five-finger position stays in place", () => {
  const fingers = suggestFingering(melody([60, 62, 64, 65, 67, 65, 64, 62, 60], "right"));
  assert.deepEqual(fingers, [1, 2, 3, 4, 5, 4, 3, 2, 1]);
});

test("repeated notes keep the same finger", () => {
  const fingers = suggestFingering(melody([67, 67, 69, 67], "right"));
  assert.equal(fingers[0], fingers[1]);
});

test("thumb avoids black keys when there is a reasonable alternative", () => {
  // C# D E F: starting on finger 2 keeps the thumb off the black key.
  const fingers = suggestFingering(melody([61, 62, 64, 65], "right"));
  assert.notEqual(fingers[0], 1);
});

test("chords spread across the hand from the outer notes", () => {
  assert.deepEqual(chordFingering([60, 64, 67], "right"), [1, 3, 5]);
  assert.deepEqual(chordFingering([48, 52, 55], "left"), [5, 3, 1]);
  assert.deepEqual(chordFingering([60, 62], "right"), [1, 2]);
});

test("every note gets a finger between 1 and 5, aligned with input order", () => {
  const notes = [
    { midi: 72, time: 1, duration: 0.5, hand: "right" as const },
    { midi: 48, time: 0, duration: 1, hand: "left" as const },
    { midi: 60, time: 0, duration: 0.5, hand: "right" as const },
    { midi: 64, time: 0, duration: 0.5, hand: "right" as const },
  ];
  const fingers = suggestFingering(notes);
  assert.equal(fingers.length, notes.length);
  fingers.forEach((finger) => assert.ok(finger !== null && finger >= 1 && finger <= 5));
});
