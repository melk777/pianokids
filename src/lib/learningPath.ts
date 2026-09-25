import type { Difficulty } from "@/lib/songFilters";
// Relative import so the module also runs under `node --test`.
import { exerciseId } from "./exercises.ts";

/**
 * "Do zero ao louvor": a guided path from the first note to accompanying
 * hymns with both hands. Each lesson is a song or generated exercise with a
 * concrete goal; the next lesson unlocks when the goal is met.
 */

export type LessonHands = "right" | "left" | "both";

export interface Lesson {
  id: string;
  songId: string;
  title: string;
  skill: string;
  hands: LessonHands;
  difficulty: Difficulty;
  /** Minimum accuracy (%) on a completed run. */
  goalAccuracy: number;
}

export interface LearningUnit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

/** Best result per song, difficulty and hand mode, as returned by the practice API. */
export interface SongResult {
  songId: string;
  difficulty: string;
  handMode: string;
  bestAccuracy: number;
  completions: number;
}

const lesson = (
  id: string,
  songId: string,
  title: string,
  skill: string,
  hands: LessonHands,
  difficulty: Difficulty,
  goalAccuracy: number,
): Lesson => ({ id, songId, title, skill, hands, difficulty, goalAccuracy });

export const LEARNING_PATH: LearningUnit[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    description: "A mão direita na posição de Dó e as primeiras melodias.",
    lessons: [
      lesson("1-1", exerciseId("cinco-dedos", "do", "md"), "Cinco dedos em Dó", "Cada dedo em uma tecla", "right", "beginner", 70),
      lesson("1-2", "parabens-pra-voce", "Parabéns pra Você", "Primeira melodia completa", "right", "beginner", 70),
      lesson("1-3", "twinkle-twinkle", "Brilha Brilha Estrelinha", "Saltos pequenos na mão direita", "right", "beginner", 75),
      lesson("1-4", "amazing-grace", "Amazing Grace", "Seu primeiro hino", "right", "beginner", 70),
    ],
  },
  {
    id: "mao-esquerda",
    title: "A mão esquerda",
    description: "Acordar a mão esquerda e aprender a escala de Dó.",
    lessons: [
      lesson("2-1", exerciseId("cinco-dedos", "do", "me"), "Cinco dedos em Dó · esquerda", "Posição da mão esquerda", "left", "beginner", 70),
      lesson("2-2", exerciseId("escala", "do", "md"), "Escala de Dó maior", "Passagem do polegar", "right", "beginner", 75),
      lesson("2-3", exerciseId("escala", "do", "me"), "Escala de Dó · esquerda", "Passagem do polegar à esquerda", "left", "beginner", 70),
      lesson("2-4", "noite-feliz", "Noite Feliz", "Notas longas e compasso ternário", "right", "beginner", 75),
    ],
  },
  {
    id: "duas-maos",
    title: "Duas mãos",
    description: "Tocar melodia e baixo ao mesmo tempo.",
    lessons: [
      lesson("3-1", exerciseId("cadencia", "do", "maos"), "Acordes I–IV–V–I em Dó", "Os três acordes principais", "both", "beginner", 70),
      lesson("3-2", "o-cravo-e-a-rosa", "O Cravo e a Rosa", "Primeira música com as duas mãos", "both", "medium", 65),
      lesson("3-3", "rocha-eterna", "Rocha Eterna", "Hino a duas mãos", "both", "medium", 65),
    ],
  },
  {
    id: "acordes-louvor",
    title: "Acordes para o louvor",
    description: "As tonalidades mais usadas nas igrejas e hinos completos.",
    lessons: [
      lesson("4-1", exerciseId("cadencia", "sol", "maos"), "Acordes em Sol", "Acompanhar em Sol maior", "both", "beginner", 70),
      lesson("4-2", exerciseId("cadencia", "fa", "maos"), "Acordes em Fá", "Acompanhar em Fá maior", "both", "beginner", 70),
      lesson("4-3", "mais-perto-quero-estar", "Mais Perto Quero Estar", "Hino com acompanhamento", "both", "medium", 70),
      lesson("4-4", "chuvas-de-graca", "Chuvas de Graça", "Ritmo de hino com as duas mãos", "both", "medium", 70),
    ],
  },
  {
    id: "novas-tonalidades",
    title: "Novas tonalidades",
    description: "Escalas, arpejos e hinos em outras tonalidades.",
    lessons: [
      lesson("5-1", exerciseId("escala", "sol", "md"), "Escala de Sol maior", "O primeiro sustenido", "right", "beginner", 75),
      lesson("5-2", exerciseId("arpejo", "do", "md"), "Arpejo em Dó", "Abrir a mão com leveza", "right", "beginner", 75),
      lesson("5-3", "santo-santo-santo", "Santo, Santo, Santo", "Hino em andamento lento", "both", "medium", 70),
      lesson("5-4", "deus-velara-por-ti", "Deus Velará por Ti", "Hino completo a duas mãos", "both", "medium", 75),
    ],
  },
];

export const ALL_LESSONS: Lesson[] = LEARNING_PATH.flatMap((unit) => unit.lessons);

const DIFFICULTY_RANK: Record<string, number> = { beginner: 0, medium: 1, pro: 2 };

function handModeSatisfies(handMode: string, required: LessonHands) {
  if (required === "both") return handMode === "both";
  return handMode === required || handMode === "both";
}

export function isLessonComplete(lessonToCheck: Lesson, results: SongResult[]) {
  return results.some(
    (result) =>
      result.songId === lessonToCheck.songId &&
      result.completions > 0 &&
      result.bestAccuracy >= lessonToCheck.goalAccuracy &&
      (DIFFICULTY_RANK[result.difficulty] ?? -1) >= DIFFICULTY_RANK[lessonToCheck.difficulty] &&
      handModeSatisfies(result.handMode, lessonToCheck.hands),
  );
}

/** First unit a student may enter, from the onboarding level answer. */
export function startUnitIndexForLevel(level: string | null | undefined) {
  if (level === "pro") return 3;
  if (level === "medium") return 2;
  return 0;
}

export type LessonStatus = "done" | "current" | "open" | "locked";

export interface LessonProgress {
  lesson: Lesson;
  unitIndex: number;
  status: LessonStatus;
}

/**
 * Lessons are unlocked in order. Units before the student's starting level
 * stay open (never locked) so experienced students can skip ahead.
 */
export function buildPathProgress(results: SongResult[], startUnitIndex = 0) {
  const progress: LessonProgress[] = [];
  let previousDone = true;
  let currentAssigned = false;

  LEARNING_PATH.forEach((unit, unitIndex) => {
    unit.lessons.forEach((item) => {
      const done = isLessonComplete(item, results);
      const reachable = previousDone || unitIndex < startUnitIndex;
      let status: LessonStatus;
      if (done) status = "done";
      else if (reachable && !currentAssigned && unitIndex >= startUnitIndex) {
        status = "current";
        currentAssigned = true;
      } else if (reachable) status = "open";
      else status = "locked";
      progress.push({ lesson: item, unitIndex, status });
      // Skipped units (below the starting level) never block what comes after.
      previousDone = done || unitIndex < startUnitIndex;
    });
  });

  const completed = progress.filter((item) => item.status === "done").length;
  const current = progress.find((item) => item.status === "current") ?? null;
  return { progress, completed, total: progress.length, current };
}

export function lessonHref(item: Lesson) {
  const params = new URLSearchParams({
    leftHand: String(item.hands !== "right"),
    rightHand: String(item.hands !== "left"),
    difficulty: item.difficulty,
    lesson: item.id,
  });
  return `/dashboard/play/${item.songId}?${params.toString()}`;
}

export function findLesson(id: string | null | undefined) {
  if (!id) return undefined;
  return ALL_LESSONS.find((item) => item.id === id);
}

export function nextLessonAfter(id: string) {
  const index = ALL_LESSONS.findIndex((item) => item.id === id);
  return index >= 0 ? ALL_LESSONS[index + 1] : undefined;
}

export function describeGoal(item: Lesson) {
  const hands = item.hands === "both" ? "as duas mãos" : item.hands === "right" ? "a mão direita" : "a mão esquerda";
  return `${item.goalAccuracy}% de precisão com ${hands}, tocando até o fim`;
}

/** Daily practice target in seconds. */
export const DAILY_GOAL_SECONDS = 10 * 60;
