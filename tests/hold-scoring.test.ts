import assert from "node:assert/strict";
import test from "node:test";

import { holdReleaseDeadline, isEarlyRelease, isLongNote } from "../src/lib/holdScoring.ts";

test("only notes of at least 0.6s are judged for holding", () => {
  assert.equal(isLongNote({ duration: 0.5 }), false);
  assert.equal(isLongNote({ duration: 0.6 }), true);
  assert.equal(isLongNote({ duration: 2 }), true);
});

test("release tolerance is 0.15s or 20% of the note, whichever is larger", () => {
  assert.equal(holdReleaseDeadline({ time: 10, duration: 0.6 }), 10.45);
  assert.equal(holdReleaseDeadline({ time: 10, duration: 2 }), 11.6);
});

test("letting go before the deadline is an early release", () => {
  const note = { time: 4, duration: 2 };
  assert.equal(isEarlyRelease(note, 4.5), true);
  assert.equal(isEarlyRelease(note, 5.59), true);
  assert.equal(isEarlyRelease(note, 5.6), false);
  assert.equal(isEarlyRelease(note, 6.3), false);
});
