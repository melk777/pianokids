import type { SongNote } from "@/lib/types";

/** Notes at least this long (song seconds) are judged on how long they are held. */
export const MIN_HOLD_SECONDS = 0.6;

export function isLongNote(note: Pick<SongNote, "duration">) {
  return note.duration >= MIN_HOLD_SECONDS;
}

/**
 * Earliest release (song time) that still counts as holding the note to the
 * end. The tolerance grows with the note so long notes are not unforgiving.
 */
export function holdReleaseDeadline(note: Pick<SongNote, "time" | "duration">) {
  return note.time + note.duration - Math.max(0.15, note.duration * 0.2);
}

export function isEarlyRelease(note: Pick<SongNote, "time" | "duration">, releaseTime: number) {
  return releaseTime < holdReleaseDeadline(note);
}
