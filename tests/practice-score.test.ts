import assert from "node:assert/strict";
import test from "node:test";
import { calculatePracticeAccuracy } from "../src/lib/practice-score.ts";

test("wrong notes reduce practice accuracy", () => {
  assert.equal(calculatePracticeAccuracy(8, 1, 1), 80);
});

test("an untouched song starts at one hundred percent", () => {
  assert.equal(calculatePracticeAccuracy(0, 0, 0), 100);
});

test("negative client values cannot improve accuracy", () => {
  assert.equal(calculatePracticeAccuracy(5, -2, -3), 100);
});

