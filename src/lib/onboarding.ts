import type { Difficulty, HandSelection } from "@/lib/songFilters";
import type { Song } from "@/lib/types";

export const ONBOARDING_STORAGE_KEY = "pianify.onboarding.v1";

export type LearningLevel = "beginner" | "medium" | "pro";
export type LearningGoal = "kids" | "worship" | "classic" | "popular";
export type InstrumentType = "keyboard" | "piano" | "phone";

export interface OnboardingPreferences {
  level: LearningLevel;
  goal: LearningGoal;
  instrument: InstrumentType;
  completedAt: string;
  skipped?: boolean;
}

export function getStoredOnboardingPreferences(): OnboardingPreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingPreferences;
  } catch {
    return null;
  }
}

export function saveOnboardingPreferences(preferences: Omit<OnboardingPreferences, "completedAt">) {
  if (typeof window === "undefined") return;

  const payload: OnboardingPreferences = {
    ...preferences,
    completedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
}

export function skipOnboarding() {
  saveOnboardingPreferences({
    level: "beginner",
    goal: "kids",
    instrument: "phone",
    skipped: true,
  });
}

export function getPreferredDifficulty(level: LearningLevel): Difficulty {
  if (level === "pro") return "pro";
  if (level === "medium") return "medium";
  return "beginner";
}

export function getPreferredHandSelection(level: LearningLevel): HandSelection {
  if (level === "pro") {
    return { includeLeftHand: true, includeRightHand: true };
  }

  return { includeLeftHand: false, includeRightHand: true };
}

export function buildOnboardingSongRecommendation(
  songs: Song[],
  preferences: OnboardingPreferences | null,
) {
  if (!preferences || preferences.skipped || songs.length === 0) return null;

  const categoryByGoal: Record<LearningGoal, string[]> = {
    kids: ["Infantis"],
    worship: ["Religiosos"],
    classic: ["Clássicos", "ClÃ¡ssicos"],
    popular: ["Intro de Filmes"],
  };

  const preferredCategories = categoryByGoal[preferences.goal];
  const difficulty = getPreferredDifficulty(preferences.level);
  const handSelection = getPreferredHandSelection(preferences.level);
  const candidates = songs.filter((song) => {
    const categories = song.categories?.length ? song.categories : [song.category];
    return categories.some((category) => preferredCategories.includes(category));
  });

  const song = candidates[0] ?? songs[0];
  if (!song) return null;

  const params = new URLSearchParams({
    difficulty,
    leftHand: String(handSelection.includeLeftHand),
    rightHand: String(handSelection.includeRightHand),
    mic: preferences.instrument === "phone" ? "false" : "true",
  });

  return {
    song,
    difficulty,
    handSelection,
    href: `/dashboard/play/${song.id}?${params.toString()}`,
  };
}

function buildPracticeHref(song: Song, difficulty: Difficulty, handSelection: HandSelection, mic: boolean) {
  const params = new URLSearchParams({
    difficulty,
    leftHand: String(handSelection.includeLeftHand),
    rightHand: String(handSelection.includeRightHand),
    mic: String(mic),
  });

  return `/dashboard/play/${song.id}?${params.toString()}`;
}

export function buildFirstLessonOptions(songs: Song[], preferences: OnboardingPreferences | null) {
  if (songs.length === 0) return [];

  const beginnerHands = { includeLeftHand: false, includeRightHand: true };
  const easySongs = songs
    .filter((song) => {
      const categories = song.categories?.length ? song.categories : [song.category];
      return song.difficulty === "FÃ¡cil" || categories.includes("Infantis");
    })
    .sort((a, b) => (a.noteCount ?? a.notes.length) - (b.noteCount ?? b.notes.length));

  const curated = [
    easySongs.find((song) => song.id.includes("brilha") || song.title.toLowerCase().includes("brilha")),
    easySongs.find((song) => song.id.includes("borboletinha") || song.title.toLowerCase().includes("borboletinha")),
    easySongs.find((song) => song.id.includes("sapo") || song.title.toLowerCase().includes("sapo")),
    ...easySongs,
  ].filter((song): song is Song => Boolean(song));

  const unique = Array.from(new Map(curated.map((song) => [song.id, song])).values()).slice(0, 3);
  const mic = preferences?.instrument === "phone" ? false : true;

  return unique.map((song, index) => ({
    song,
    difficulty: "beginner" as Difficulty,
    handSelection: beginnerHands,
    href: buildPracticeHref(song, "beginner", beginnerHands, mic),
    label: index === 0 ? "Mais facil para comecar" : index === 1 ? "Boa para primeira semana" : "Treino rapido",
    reason: `${song.noteCount ?? song.notes.length} notas no modo iniciante, usando apenas a mao direita.`,
  }));
}
