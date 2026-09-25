import type { Song, SongNote } from "@/lib/types";

/**
 * Technique exercises generated in code: five-finger patterns, major scales,
 * arpeggios and the I-IV-V-I cadence in all twelve major keys. They are
 * original material (no third-party rights) and feed both the library and
 * the learning path.
 */

export const EXERCISE_CATEGORY = "Exercícios";
export const EXERCISE_ID_PREFIX = "exercicio-";

type ExerciseKind = "cinco-dedos" | "escala" | "arpejo" | "cadencia";
type ExerciseHand = "md" | "me" | "maos";

export interface ExerciseKey {
  slug: string;
  name: string;
  pitchClass: number;
}

export const EXERCISE_KEYS: ExerciseKey[] = [
  { slug: "do", name: "Dó", pitchClass: 0 },
  { slug: "sol", name: "Sol", pitchClass: 7 },
  { slug: "fa", name: "Fá", pitchClass: 5 },
  { slug: "re", name: "Ré", pitchClass: 2 },
  { slug: "si-bemol", name: "Si♭", pitchClass: 10 },
  { slug: "la", name: "Lá", pitchClass: 9 },
  { slug: "mi-bemol", name: "Mi♭", pitchClass: 3 },
  { slug: "mi", name: "Mi", pitchClass: 4 },
  { slug: "la-bemol", name: "Lá♭", pitchClass: 8 },
  { slug: "si", name: "Si", pitchClass: 11 },
  { slug: "re-bemol", name: "Ré♭", pitchClass: 1 },
  { slug: "fa-sustenido", name: "Fá♯", pitchClass: 6 },
];

/** Keys included in the free plan; the rest of the exercise set is Pro. */
const FREE_KEY_SLUGS = new Set(["do", "sol", "fa", "re"]);

const KIND_INFO: Record<ExerciseKind, { title: string; difficulty: string; bpm: number }> = {
  "cinco-dedos": { title: "Cinco dedos", difficulty: "Fácil", bpm: 72 },
  escala: { title: "Escala maior", difficulty: "Fácil", bpm: 76 },
  arpejo: { title: "Arpejo", difficulty: "Médio", bpm: 80 },
  cadencia: { title: "Acordes I–IV–V–I", difficulty: "Médio", bpm: 60 },
};

const HAND_LABEL: Record<ExerciseHand, string> = {
  md: "mão direita",
  me: "mão esquerda",
  maos: "duas mãos",
};

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11, 12];
const FIVE_FINGER = [0, 2, 4, 5, 7];
const ARPEGGIO = [0, 4, 7, 12];

export function exerciseId(kind: ExerciseKind, keySlug: string, hand: ExerciseHand) {
  return `${EXERCISE_ID_PREFIX}${kind}-${keySlug}-${hand}`;
}

export function isExerciseId(id: string) {
  return id.startsWith(EXERCISE_ID_PREFIX);
}

/** Tonic near middle C for the right hand, one octave lower for the left. */
function tonic(key: ExerciseKey, hand: "right" | "left") {
  const base = 60 + (key.pitchClass > 6 ? key.pitchClass - 12 : key.pitchClass);
  return hand === "right" ? base : base - 12;
}

function upAndDown(intervals: number[]) {
  return [...intervals, ...intervals.slice(0, -1).reverse()];
}

function melodicLine(root: number, intervals: number[], beat: number, hand: "right" | "left", repeats = 1): SongNote[] {
  const sequence = Array.from({ length: repeats }, (_, index) =>
    index === 0 ? upAndDown(intervals) : upAndDown(intervals).slice(1),
  ).flat();
  return sequence.map((interval, index) => ({
    midi: root + interval,
    time: index * beat,
    // The final note is held so every exercise ends on a long note.
    duration: index === sequence.length - 1 ? beat * 2 : beat * 0.9,
    hand,
    velocity: 0.75,
  }));
}

function cadence(key: ExerciseKey, beat: number): SongNote[] {
  const top = tonic(key, "right");
  const bass = tonic(key, "left");
  // Close voicings so the right hand barely moves: I, IV (2nd inv.), V (1st inv.), I.
  const chords = [
    { right: [0, 4, 7], left: 0 },
    { right: [0, 5, 9], left: 5 },
    { right: [-1, 2, 7], left: -5 },
    { right: [0, 4, 7], left: 0 },
  ];
  const chordLength = beat * 2;
  return chords.flatMap((chord, index) => {
    const time = index * chordLength;
    const duration = index === chords.length - 1 ? chordLength * 1.5 : chordLength * 0.92;
    return [
      ...chord.right.map((interval) => ({ midi: top + interval, time, duration, hand: "right" as const, velocity: 0.7 })),
      { midi: bass + chord.left, time, duration, hand: "left" as const, velocity: 0.7 },
    ];
  });
}

function buildNotes(kind: ExerciseKind, key: ExerciseKey, hand: ExerciseHand, beat: number): SongNote[] {
  if (kind === "cadencia") return cadence(key, beat);
  const side = hand === "me" ? "left" : "right";
  const root = tonic(key, side);
  if (kind === "cinco-dedos") return melodicLine(root, FIVE_FINGER, beat, side, 2);
  if (kind === "escala") return melodicLine(root, MAJOR_SCALE, beat, side);
  return melodicLine(root, ARPEGGIO, beat, side, 2);
}

function buildExercise(kind: ExerciseKind, key: ExerciseKey, hand: ExerciseHand): Song {
  const info = KIND_INFO[kind];
  const beat = 60 / info.bpm;
  const notes = buildNotes(kind, key, hand, beat);
  const last = notes.reduce((end, note) => Math.max(end, note.time + note.duration), 0);
  return {
    id: exerciseId(kind, key.slug, hand),
    title: `${info.title} em ${key.name} maior`,
    artist: `Exercício · ${HAND_LABEL[hand]}`,
    difficulty: info.difficulty,
    bpm: info.bpm,
    duration: Math.ceil(last + 1),
    category: EXERCISE_CATEGORY,
    categories: [EXERCISE_CATEGORY],
    isPremium: !FREE_KEY_SLUGS.has(key.slug),
    noteCount: notes.length,
    notes,
    // Exercises are already graded by design: every level plays the same notes.
    arrangements: { easy: notes, medium: notes, hard: notes },
  };
}

let cache: Song[] | null = null;

/** Every generated exercise, in teaching order (easiest keys first). */
export function getExercises(): Song[] {
  if (cache) return cache;
  const list: Song[] = [];
  for (const kind of ["cinco-dedos", "escala", "arpejo"] as const) {
    for (const key of EXERCISE_KEYS) {
      list.push(buildExercise(kind, key, "md"));
      list.push(buildExercise(kind, key, "me"));
    }
  }
  for (const key of EXERCISE_KEYS) list.push(buildExercise("cadencia", key, "maos"));
  cache = list;
  return list;
}

export function getExerciseById(id: string): Song | undefined {
  if (!isExerciseId(id)) return undefined;
  return getExercises().find((exercise) => exercise.id === id);
}

/** Catalog entry without the notes, as the library index lists songs. */
export function toCatalogEntry(song: Song): Song {
  return { ...song, notes: [], arrangements: null };
}
