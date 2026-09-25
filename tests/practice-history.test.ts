import assert from "node:assert/strict";
import test from "node:test";

import { buildSongResults, practiceSecondsOn } from "../src/lib/practiceHistory.ts";

const session = (overrides: Record<string, unknown>) => ({
  id: "s",
  user_id: "u",
  song_id: "parabens-pra-voce",
  song_title: "Parabéns",
  difficulty: "beginner",
  hand_mode: "right",
  accuracy: 70,
  score: 0,
  combo: 0,
  duration_seconds: 60,
  completed: true,
  practiced_on: "2026-09-25",
  created_at: "2026-09-25T12:00:00Z",
  ...overrides,
});

test("keeps the best completed accuracy per song, difficulty and hand mode", () => {
  const results = buildSongResults([
    session({ accuracy: 70 }),
    session({ accuracy: 92 }),
    session({ accuracy: 99, completed: false }),
    session({ hand_mode: "both", accuracy: 50 }),
  ]);
  const right = results.find((item) => item.handMode === "right");
  assert.equal(right?.bestAccuracy, 92);
  assert.equal(right?.completions, 2);
  assert.equal(results.find((item) => item.handMode === "both")?.bestAccuracy, 50);
});

test("abandoned runs do not count as completions", () => {
  const [only] = buildSongResults([session({ completed: false, accuracy: 100 })]);
  assert.equal(only.completions, 0);
  assert.equal(only.bestAccuracy, 0);
});

test("sums practice time for one day only", () => {
  const sessions = [
    session({ duration_seconds: 120 }),
    session({ duration_seconds: 200 }),
    session({ duration_seconds: 999, practiced_on: "2026-09-24" }),
  ];
  assert.equal(practiceSecondsOn(sessions, "2026-09-25"), 320);
});
