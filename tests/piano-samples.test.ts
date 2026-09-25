import assert from "node:assert/strict";
import test from "node:test";

import { PIANO_SAMPLES, nearestSample, samplePath } from "../src/lib/pianoSamples.ts";

test("the sample set covers the 88 keys every three semitones", () => {
  assert.equal(PIANO_SAMPLES.length, 30);
  assert.equal(PIANO_SAMPLES[0].midi, 21); // A0
  assert.equal(PIANO_SAMPLES[PIANO_SAMPLES.length - 1].midi, 108); // C8
  const c4 = PIANO_SAMPLES.find((sample) => sample.name === "C4");
  assert.equal(c4?.midi, 60);
  assert.equal(samplePath(c4!), "/audio/piano/salamander/C4.mp3");
});

test("recorded notes play untouched", () => {
  const { sample, playbackRate } = nearestSample(60);
  assert.equal(sample.name, "C4");
  assert.equal(playbackRate, 1);
});

test("in-between notes are tuned from the nearest recording", () => {
  const cSharp = nearestSample(61);
  assert.equal(cSharp.sample.name, "C4");
  assert.ok(Math.abs(cSharp.playbackRate - Math.pow(2, 1 / 12)) < 1e-9);

  const d = nearestSample(62);
  assert.equal(d.sample.name, "Ds4");
  assert.ok(d.playbackRate < 1);
});

test("no key is shifted more than 1.5 semitones", () => {
  for (let midi = 21; midi <= 108; midi++) {
    const { sample } = nearestSample(midi);
    assert.ok(Math.abs(sample.midi - midi) <= 1.5, `midi ${midi}`);
  }
});
