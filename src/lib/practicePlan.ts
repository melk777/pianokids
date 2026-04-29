import type { PracticeFeedbackSummary } from "@/lib/types";
import type { Difficulty } from "@/lib/songFilters";

export interface PracticePlanSummary {
  level: "review" | "steady" | "advance" | "mastered";
  title: string;
  message: string;
  nextActionLabel: string;
  targetAccuracy: number;
  suggestedSpeed: number;
  focusAreas: string[];
  preferPracticeRange: boolean;
}

interface PracticePlanInput {
  accuracy: number;
  difficulty: Difficulty;
  feedback?: PracticeFeedbackSummary;
}

function difficultyTarget(difficulty: Difficulty) {
  if (difficulty === "beginner") return 85;
  if (difficulty === "medium") return 88;
  return 92;
}

export function buildPracticePlan({ accuracy, difficulty, feedback }: PracticePlanInput): PracticePlanSummary {
  const targetAccuracy = difficultyTarget(difficulty);
  const focusAreas: string[] = [];

  if (!feedback || feedback.totalNotes === 0) {
    return {
      level: "steady",
      title: "Comece com uma leitura calma",
      message: "Toque a música uma vez em velocidade confortável para gerar um plano personalizado.",
      nextActionLabel: "Tocar novamente",
      targetAccuracy,
      suggestedSpeed: difficulty === "beginner" ? 0.75 : 0.85,
      focusAreas: ["Leitura inicial", "Pulso constante"],
      preferPracticeRange: false,
    };
  }

  if (feedback.problemNotes.length > 0) {
    focusAreas.push(`Notas foco: ${feedback.problemNotes.map((note) => note.name ?? note.midi).join(", ")}`);
  }

  if (feedback.lateHits > feedback.earlyHits + 1) {
    focusAreas.push("Antecipar a leitura antes da linha");
  } else if (feedback.earlyHits > feedback.lateHits + 1) {
    focusAreas.push("Esperar a nota encostar na zona de acerto");
  } else {
    focusAreas.push("Manter timing equilibrado");
  }

  if (feedback.wrongNotes > 0) {
    focusAreas.push("Evitar notas fora da mão esperada");
  }

  if (feedback.cleanLoopPasses >= 2) {
    return {
      level: "mastered",
      title: "Trecho dominado",
      message: "Você completou repetições limpas. Agora vale subir um pouco a velocidade ou tocar a música inteira.",
      nextActionLabel: "Subir velocidade",
      targetAccuracy,
      suggestedSpeed: 1,
      focusAreas,
      preferPracticeRange: false,
    };
  }

  if (feedback.weakestRange && feedback.weakestRange.misses >= 2) {
    return {
      level: "review",
      title: "Treine o trecho difícil",
      message: "Existe um ponto claro para isolar. Use loop, modo espera e velocidade reduzida antes de voltar ao fluxo completo.",
      nextActionLabel: "Treinar trecho",
      targetAccuracy,
      suggestedSpeed: 0.65,
      focusAreas,
      preferPracticeRange: true,
    };
  }

  if (feedback.wrongNotes >= 3 || accuracy < 60) {
    return {
      level: "review",
      title: "Reconstrua com calma",
      message: "A performance ainda está instável. Reduza a velocidade e priorize tocar só as notas que aparecem.",
      nextActionLabel: "Repetir devagar",
      targetAccuracy,
      suggestedSpeed: 0.7,
      focusAreas,
      preferPracticeRange: false,
    };
  }

  if (accuracy >= targetAccuracy && feedback.averageTimingMs <= 120) {
    return {
      level: "advance",
      title: "Pronto para avançar",
      message: "A precisão e o timing estão fortes. Continue para a próxima música ou aumente a dificuldade.",
      nextActionLabel: "Próxima música",
      targetAccuracy,
      suggestedSpeed: 1,
      focusAreas,
      preferPracticeRange: false,
    };
  }

  return {
    level: "steady",
    title: "Consolidar mais uma vez",
    message: "Você está perto da meta. Repita mantendo o mesmo andamento e busque uma sequência maior sem quebras.",
    nextActionLabel: "Tocar novamente",
    targetAccuracy,
    suggestedSpeed: 0.85,
    focusAreas,
    preferPracticeRange: false,
  };
}
