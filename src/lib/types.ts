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
  isPremium: boolean;
  coverUrl?: string;
  notes: SongNote[];
  arrangements?: SongArrangements | null;
  notes1Hand?: SongNote[] | null;
  notes2Hands?: SongNote[] | null;
}
