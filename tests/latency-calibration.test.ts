import assert from "node:assert/strict";
import test from "node:test";

import { estimateLatencyMs } from "../src/lib/latencyCalibration.ts";

const beats = Array.from({ length: 10 }, (_, index) => 1 + index * 0.6);

test("measures a consistent delay from taps that follow each beat", () => {
  const taps = beats.map((beat) => beat + 0.12);
  assert.equal(estimateLatencyMs(beats, taps), 120);
});

test("ignores warm-up beats and a few stray taps", () => {
  const taps = [
    beats[0] + 0.4, // warm-up, ignored
    ...beats.slice(2).map((beat) => beat + 0.08),
    beats[5] + 0.3, // stray double tap
  ];
  assert.equal(estimateLatencyMs(beats, taps), 80);
});

test("never reports a negative delay", () => {
  const taps = beats.map((beat) => beat - 0.05);
  assert.equal(estimateLatencyMs(beats, taps), 0);
});

test("needs enough taps to trust the result", () => {
  assert.equal(estimateLatencyMs(beats, [beats[3] + 0.1, beats[4] + 0.1]), null);
  assert.equal(estimateLatencyMs(beats.slice(0, 2), beats.map((beat) => beat + 0.1)), null);
});
