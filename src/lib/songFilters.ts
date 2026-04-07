import type { SongNote } from "./songs";

/* ──────────────────────────────────────────────────────
   Difficulty Filters
   ────────────────────────────────────────────────────── */

export type Difficulty = "beginner" | "medium" | "pro";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Iniciante",
  medium: "Médio",
  pro: "Profissional",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "text-emerald-400",
  medium: "text-magenta",
  pro: "text-magenta",
};

/** Timing windows per difficulty (in seconds) */
export const TIMING_WINDOWS: Record<Difficulty, number> = {
  beginner: 0.35, // generous
  medium: 0.25,   // standard
  pro: 0.15,      // strict
};

/**
 * Filter song notes based on difficulty level.
 *
 * - Beginner: Right hand only (midi >= 60), no ornaments (duration < 0.15s),
 *             collapse rapid repetitions
 * - Medium:   All notes, original timing
 * - Pro:      All notes, no filter
 */
export function filterNotesByDifficulty(
  notes: SongNote[],
  difficulty: Difficulty
): SongNote[] {
  if (difficulty === "pro" || difficulty === "medium") {
    return notes;
  }

  // Beginner: filter aggressively
  return notes.filter((note) => {
    // Only right hand (C4 and above)
    if (note.midi < 60) return false;

    // Remove ornaments (very short notes)
    if (note.duration < 0.15) return false;

    // Keep if it has hand marker and is left hand → skip
    if (note.hand === "left") return false;

    return true;
  });
}

/**
 * Get the accompaniment notes (notes the engine plays for the student to hear).
 * In beginner mode, plays the full song; in medium/pro, only left-hand/bass.
 */
export function getAccompanimentNotes(
  notes: SongNote[],
  difficulty: Difficulty
): SongNote[] {
  if (difficulty === "beginner") {
    // Play the full song as accompaniment so the student hears context
    return notes;
  }

  // For medium/pro, only auto-play left hand as backing
  const leftHand = notes.filter((n) => n.hand === "left" || n.midi < 60);
  return leftHand.length > 0 ? leftHand : [];
}
