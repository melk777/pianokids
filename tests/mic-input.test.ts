import assert from "node:assert/strict";
import test from "node:test";

import { selectMicNotes, wasPlayed } from "../src/lib/micInput.ts";

const pitch = (note: number, clarity: number, volume = 0.5) => ({ note, clarity, volume });

test("one-hand practice keeps only the clearest detected note", () => {
  const detected = [pitch(48, 0.3), pitch(60, 0.9), pitch(67, 0.4)];
  assert.deepEqual(selectMicNotes(detected, true).map((item) => item.note), [60]);
});

test("two-hand practice keeps every detected note for chords", () => {
  const detected = [pitch(48, 0.3), pitch(60, 0.9)];
  assert.equal(selectMicNotes(detected, false).length, 2);
});

test("louder notes break ties in clarity", () => {
  const detected = [pitch(60, 0.8, 0.2), pitch(62, 0.8, 0.9)];
  assert.equal(selectMicNotes(detected, true)[0].note, 62);
});

test("lenient input accepts the right note in a neighbouring octave only", () => {
  const played = new Set([72]);
  assert.equal(wasPlayed(played, 60, true), true);
  assert.equal(wasPlayed(played, 60, false), false);
  assert.equal(wasPlayed(played, 61, true), false); // a semitone off is still wrong
  assert.equal(wasPlayed(new Set([84]), 60, true), false); // two octaves is too far
});
