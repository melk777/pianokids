import assert from "node:assert/strict";
import test from "node:test";

import { focusedKeyboardRange } from "../src/lib/keyboardRange.ts";

const notes = (...midis: number[]) => midis.map((midi) => ({ midi }));

test("covers the song from a C to a B", () => {
  assert.deepEqual(focusedKeyboardRange(notes(62, 79)), { start: 60, end: 83 });
});

test("a one-octave melody gets a second octave toward middle C", () => {
  // C4-G4 only: add the octave below, where the left hand plays.
  assert.deepEqual(focusedKeyboardRange(notes(60, 67)), { start: 48, end: 71 });
  // A low left-hand line grows upward.
  assert.deepEqual(focusedKeyboardRange(notes(43, 50)), { start: 36, end: 59 });
});

test("wide songs keep every note visible", () => {
  const range = focusedKeyboardRange(notes(36, 96));
  assert.ok(range.start <= 36 && range.end >= 96);
});

test("never exceeds the 88 keys and has a sensible default", () => {
  assert.deepEqual(focusedKeyboardRange(notes(21, 108)), { start: 21, end: 108 });
  assert.deepEqual(focusedKeyboardRange([]), { start: 48, end: 83 });
});
