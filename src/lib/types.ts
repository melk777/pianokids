export interface Profile {
  id: string;
  username: string | null;
  username_changes_count: number;
  full_name: string | null;
  avatar_url: string | null;
  trophies: number;
  streak_days: number;
  total_practice_time: number;
  average_accuracy: number;
  songs_played: number;
  songs_completed: number;
  last_practice_date: string | null;
  updated_at: string;
  role: string | null;
  subscription_status?: string | null;
  subscription_plan_interval?: string | null;
  balance_withdrawn_total?: number;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  song_id: string | null;
  song_title: string | null;
  difficulty: string | null;
  hand_mode: string | null;
  accuracy: number;
  score: number;
  combo: number;
  duration_seconds: number;
  completed: boolean;
  practiced_on: string;
  created_at: string;
}

export interface PracticeAggregate {
  totalPracticeTime: number;
  songsPlayed: number;
  songsCompleted: number;
  averageAccuracy: number;
  streakDays: number;
  lastPracticeDate: string | null;
}

export interface SongNote {
  midi: number;
  time: number;
  duration: number;
  hand?: "left" | "right";
  velocity?: number;
}

export type ArrangementLevel = "easy" | "medium" | "hard";

export interface SongArrangements {
  easy?: SongNote[] | null;
  medium?: SongNote[] | null;
  hard?: SongNote[] | null;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: "Fácil" | "Médio" | "Difícil" | string;
  bpm: number;
  duration: number;
  category: string;
  categories?: string[] | null;
  isPremium: boolean;
  coverUrl?: string;
  notes: SongNote[];
  arrangements?: SongArrangements | null;
  notes1Hand?: SongNote[] | null;
  notes2Hands?: SongNote[] | null;
}
