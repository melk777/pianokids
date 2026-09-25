"use client";

import type { PracticeAggregate, PracticeSession } from "@/lib/types";
import type { SongResult } from "@/lib/learningPath";

export interface PracticeSnapshot {
  supported: boolean;
  aggregate: PracticeAggregate | null;
  recentSessions: PracticeSession[];
  /** Best result per song/difficulty/hands, used by the learning path. */
  songResults: SongResult[];
  /** Seconds practiced today (Brazil time), for the daily goal. */
  todaySeconds: number;
}

// Header, dashboard pages and the profile hook all need the same practice
// snapshot on load. Share one request between them instead of issuing one per
// component, and reuse the answer briefly so navigation feels instant.
const SNAPSHOT_TTL_MS = 10_000;

let inflight: Promise<PracticeSnapshot | null> | null = null;
let cached: { at: number; value: PracticeSnapshot | null } | null = null;
let generation = 0;

export function loadPracticeSnapshot(): Promise<PracticeSnapshot | null> {
  if (cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) {
    return Promise.resolve(cached.value);
  }

  const requestGeneration = generation;
  inflight ??= fetch("/api/practice/session", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json();
      return {
        supported: Boolean(data?.supported),
        aggregate: data?.aggregate ?? null,
        recentSessions: (data?.recentSessions ?? []) as PracticeSession[],
        songResults: (data?.songResults ?? []) as SongResult[],
        todaySeconds: Number(data?.todaySeconds) || 0,
      };
    })
    .catch(() => null)
    .then((value) => {
      // Only successful answers are reused, and never one that started before
      // a newer practice session was saved.
      if (requestGeneration === generation) {
        cached = value ? { at: Date.now(), value } : null;
        inflight = null;
      }
      return value;
    });

  return inflight;
}

export function invalidatePracticeSnapshot() {
  generation += 1;
  cached = null;
  inflight = null;
}
