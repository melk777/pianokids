import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import {
  ALL_LESSONS,
  buildPathProgress,
  isLessonComplete,
  lessonHref,
  nextLessonAfter,
  startUnitIndexForLevel,
  type SongResult,
} from "../src/lib/learningPath.ts";
import { getExerciseById } from "../src/lib/exercises.ts";

const catalog = JSON.parse(fs.readFileSync(new URL("../public/song-catalog-index.json", import.meta.url), "utf8")) as Array<{
  id: string;
  isPremium: boolean;
}>;

const result = (songId: string, overrides: Partial<SongResult> = {}): SongResult => ({
  songId,
  difficulty: "beginner",
  handMode: "right",
  bestAccuracy: 90,
  completions: 1,
  ...overrides,
});

test("every lesson points to a real, free song or exercise", () => {
  for (const item of ALL_LESSONS) {
    const exercise = getExerciseById(item.songId);
    const song = exercise ?? catalog.find((entry) => entry.id === item.songId);
    assert.ok(song, `missing ${item.songId}`);
    assert.equal(song.isPremium, false, `${item.songId} should be free so the path is open to everyone`);
  }
  assert.equal(new Set(ALL_LESSONS.map((item) => item.id)).size, ALL_LESSONS.length);
});

test("a lesson needs a completed run at the goal accuracy with the right hands", () => {
  const first = ALL_LESSONS[0];
  assert.equal(isLessonComplete(first, [result(first.songId)]), true);
  assert.equal(isLessonComplete(first, [result(first.songId, { bestAccuracy: 60 })]), false);
  assert.equal(isLessonComplete(first, [result(first.songId, { completions: 0 })]), false);
  assert.equal(isLessonComplete(first, [result(first.songId, { handMode: "left" })]), false);
  // Playing both hands also satisfies a one-hand lesson.
  assert.equal(isLessonComplete(first, [result(first.songId, { handMode: "both" })]), true);
});

test("a harder difficulty satisfies an easier goal, not the other way round", () => {
  const twoHands = ALL_LESSONS.find((item) => item.difficulty === "medium")!;
  const base = { handMode: "both" };
  assert.equal(isLessonComplete(twoHands, [result(twoHands.songId, { ...base, difficulty: "pro" })]), true);
  assert.equal(isLessonComplete(twoHands, [result(twoHands.songId, { ...base, difficulty: "beginner" })]), false);
});

test("a new student starts on the first lesson with the rest locked", () => {
  const path = buildPathProgress([]);
  assert.equal(path.current?.lesson.id, ALL_LESSONS[0].id);
  assert.equal(path.progress[1].status, "locked");
  assert.equal(path.completed, 0);
});

test("finishing a lesson moves the student to the next one", () => {
  const path = buildPathProgress([result(ALL_LESSONS[0].songId)]);
  assert.equal(path.progress[0].status, "done");
  assert.equal(path.current?.lesson.id, ALL_LESSONS[1].id);
  assert.equal(path.completed, 1);
});

test("experienced students start further ahead without earlier units locked", () => {
  const start = startUnitIndexForLevel("medium");
  const path = buildPathProgress([], start);
  assert.equal(path.current?.unitIndex, start);
  assert.ok(path.progress.filter((item) => item.unitIndex < start).every((item) => item.status === "open"));
});

test("lesson links open the player with the lesson's hands and difficulty", () => {
  const href = lessonHref(ALL_LESSONS[0]);
  assert.match(href, /^\/dashboard\/play\/exercicio-cinco-dedos-do-md\?/);
  assert.match(href, /rightHand=true/);
  assert.match(href, /leftHand=false/);
  assert.match(href, /lesson=1-1/);
  assert.equal(nextLessonAfter("1-1")?.id, "1-2");
  assert.equal(nextLessonAfter(ALL_LESSONS[ALL_LESSONS.length - 1].id), undefined);
});
