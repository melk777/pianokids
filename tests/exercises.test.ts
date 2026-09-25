import assert from "node:assert/strict";
import test from "node:test";

import { exerciseId, getExerciseById, getExercises, isExerciseId } from "../src/lib/exercises.ts";

test("generates the full exercise set with unique ids", () => {
  const exercises = getExercises();
  // 3 melodic kinds x 12 keys x 2 hands + 12 cadences.
  assert.equal(exercises.length, 84);
  assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 84);
  exercises.forEach((exercise) => {
    assert.ok(isExerciseId(exercise.id));
    assert.ok(exercise.notes.length > 0);
    assert.ok(exercise.duration > 0);
  });
});

test("C major scale is the white keys from middle C and back", () => {
  const scale = getExerciseById(exerciseId("escala", "do", "md"));
  assert.ok(scale);
  assert.deepEqual(
    scale.notes.map((note) => note.midi),
    [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60],
  );
  assert.ok(scale.notes.every((note) => note.hand === "right"));
  assert.equal(scale.isPremium, false);
});

test("left-hand exercises sit an octave below and are marked as left hand", () => {
  const fiveFinger = getExerciseById(exerciseId("cinco-dedos", "sol", "me"));
  assert.ok(fiveFinger);
  assert.equal(fiveFinger.notes[0].midi, 43); // G2
  assert.ok(fiveFinger.notes.every((note) => note.hand === "left"));
});

test("the cadence plays a right-hand triad over a left-hand bass on each chord", () => {
  const cadence = getExerciseById(exerciseId("cadencia", "do", "maos"));
  assert.ok(cadence);
  const firstChord = cadence.notes.filter((note) => note.time === 0).map((note) => note.midi).sort((a, b) => a - b);
  assert.deepEqual(firstChord, [48, 60, 64, 67]);
  assert.equal(cadence.notes.length, 16);
});

test("easier keys are free and remote keys are Pro", () => {
  assert.equal(getExerciseById(exerciseId("arpejo", "re", "md"))?.isPremium, false);
  assert.equal(getExerciseById(exerciseId("arpejo", "fa-sustenido", "md"))?.isPremium, true);
});

test("unknown ids are not exercises", () => {
  assert.equal(getExerciseById("parabens-pra-voce"), undefined);
  assert.equal(getExerciseById(`${exerciseId("escala", "do", "md")}-x`), undefined);
});
