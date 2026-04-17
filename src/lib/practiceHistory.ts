import type { PracticeAggregate, PracticeSession, Profile } from "@/lib/types";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

export function getBrazilPracticeDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function calculatePracticeStreak(practicedDates: string[]) {
  if (practicedDates.length === 0) return 0;

  const uniqueDates = Array.from(new Set(practicedDates))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) return 0;

  let streak = 1;
  for (let index = 1; index < uniqueDates.length; index++) {
    const previous = new Date(`${uniqueDates[index - 1]}T00:00:00`);
    const current = new Date(`${uniqueDates[index]}T00:00:00`);
    const diffDays = Math.round((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

export function buildPracticeAggregate(sessions: PracticeSession[]): PracticeAggregate {
  if (sessions.length === 0) {
    return {
      totalPracticeTime: 0,
      songsPlayed: 0,
      songsCompleted: 0,
      averageAccuracy: 0,
      streakDays: 0,
      lastPracticeDate: null,
    };
  }

  const totalPracticeTime = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
  const songsPlayed = sessions.length;
  const songsCompleted = sessions.reduce((sum, session) => sum + (session.completed ? 1 : 0), 0);
  const averageAccuracy = Math.round(
    sessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / Math.max(songsPlayed, 1),
  );
  const practiceDates = sessions.map((session) => session.practiced_on).filter(Boolean);

  return {
    totalPracticeTime,
    songsPlayed,
    songsCompleted,
    averageAccuracy,
    streakDays: calculatePracticeStreak(practiceDates),
    lastPracticeDate: practiceDates.sort((a, b) => b.localeCompare(a))[0] || null,
  };
}

export function mergeProfileWithPracticeAggregate(profile: Profile, aggregate?: PracticeAggregate | null): Profile {
  if (!aggregate) return profile;

  return {
    ...profile,
    total_practice_time: aggregate.totalPracticeTime,
    songs_played: aggregate.songsPlayed,
    songs_completed: aggregate.songsCompleted,
    average_accuracy: aggregate.averageAccuracy,
    streak_days: aggregate.streakDays,
    last_practice_date: aggregate.lastPracticeDate,
  };
}
