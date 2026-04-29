import type { PracticeSession, Profile, Song } from "@/lib/types";
import type { Difficulty } from "@/lib/songFilters";

export interface PracticeProgressInsight {
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  tone: "start" | "review" | "steady" | "advance";
  weeklySessions: number;
  bestRecentAccuracy: number;
  averageRecentAccuracy: number;
  focusSongTitle?: string | null;
}

export interface PracticeAchievement {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  progress: number;
  target: number;
  tone: "gold" | "cyan" | "emerald" | "magenta";
}

export interface PracticeGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

export interface PracticeRecommendation {
  songId: string;
  songTitle: string;
  reason: string;
  difficulty: Difficulty;
  handMode: "right" | "left" | "both";
  href: string;
  label: string;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function daysBetween(a: Date, b: Date) {
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / dayMs);
}

function buildPlayHref(songId: string, difficulty: Difficulty, handMode: "right" | "left" | "both") {
  const params = new URLSearchParams();
  params.set("difficulty", difficulty);
  params.set("leftHand", String(handMode === "left" || handMode === "both"));
  params.set("rightHand", String(handMode === "right" || handMode === "both"));
  params.set("mic", "false");
  return `/dashboard/play/${songId}?${params.toString()}`;
}

function isEasySong(song: Song) {
  const difficulty = String(song.difficulty || "").toLowerCase();
  return difficulty.includes("facil") || difficulty.includes("fácil") || difficulty.includes("easy");
}

function pickSong(catalog: Song[], predicate: (song: Song) => boolean, fallback?: Song | null) {
  return (
    catalog
      .filter(predicate)
      .sort((a, b) => (a.noteCount ?? a.notes?.length ?? 0) - (b.noteCount ?? b.notes?.length ?? 0))[0] ??
    fallback ??
    catalog[0] ??
    null
  );
}

export function buildPracticeProgressInsight(profile: Profile | null, sessions: PracticeSession[]): PracticeProgressInsight {
  const recent = [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentAccuracies = recent.slice(0, 5).map((session) => Number(session.accuracy) || 0);
  const averageRecentAccuracy = average(recentAccuracies);
  const bestRecentAccuracy = recentAccuracies.length > 0 ? Math.max(...recentAccuracies) : 0;
  const now = new Date();
  const weeklySessions = recent.filter((session) => daysBetween(now, new Date(session.created_at)) <= 6).length;
  const focusSession = recent.find((session) => (Number(session.accuracy) || 0) < 75) ?? recent[0] ?? null;

  if (!profile || recent.length === 0) {
    return {
      title: "Primeira meta: tocar uma musica",
      message: "Escolha uma musica facil, toque em velocidade confortavel e deixe o app criar seu historico real.",
      actionLabel: "Abrir biblioteca",
      actionHref: "/dashboard/songs",
      tone: "start",
      weeklySessions,
      bestRecentAccuracy,
      averageRecentAccuracy,
      focusSongTitle: null,
    };
  }

  if (averageRecentAccuracy < 70) {
    return {
      title: "Semana de consolidacao",
      message: "Sua precisao recente pede repeticoes mais lentas. Priorize modo espera e trechos curtos antes de subir o andamento.",
      actionLabel: "Treinar musica recente",
      actionHref: focusSession?.song_id ? `/dashboard/play/${focusSession.song_id}` : "/dashboard/songs",
      tone: "review",
      weeklySessions,
      bestRecentAccuracy,
      averageRecentAccuracy,
      focusSongTitle: focusSession?.song_title,
    };
  }

  if ((profile.streak_days || 0) < 3 || weeklySessions < 3) {
    return {
      title: "Construir constancia",
      message: "O proximo salto vem de sessoes curtas em dias seguidos. Uma musica por dia ja melhora leitura e memoria muscular.",
      actionLabel: "Praticar hoje",
      actionHref: "/dashboard/songs",
      tone: "steady",
      weeklySessions,
      bestRecentAccuracy,
      averageRecentAccuracy,
      focusSongTitle: focusSession?.song_title,
    };
  }

  if (averageRecentAccuracy >= 88 && bestRecentAccuracy >= 92) {
    return {
      title: "Pronto para novo desafio",
      message: "Seu historico recente esta forte. Experimente uma dificuldade acima ou uma musica com duas maos.",
      actionLabel: "Buscar desafio",
      actionHref: "/dashboard/songs",
      tone: "advance",
      weeklySessions,
      bestRecentAccuracy,
      averageRecentAccuracy,
      focusSongTitle: focusSession?.song_title,
    };
  }

  return {
    title: "Manter evolucao",
    message: "Voce esta criando uma boa base. Repita a musica mais recente buscando mais combo e menos notas fora do tempo.",
    actionLabel: "Continuar pratica",
    actionHref: focusSession?.song_id ? `/dashboard/play/${focusSession.song_id}` : "/dashboard/songs",
    tone: "steady",
    weeklySessions,
    bestRecentAccuracy,
    averageRecentAccuracy,
    focusSongTitle: focusSession?.song_title,
  };
}

export function buildPracticeAchievements(profile: Profile | null, sessions: PracticeSession[]): PracticeAchievement[] {
  const completedSessions = sessions.filter((session) => session.completed).length;
  const highAccuracySessions = sessions.filter((session) => (Number(session.accuracy) || 0) >= 90).length;
  const bothHandsSessions = sessions.filter((session) => session.hand_mode === "both").length;
  const proSessions = sessions.filter((session) => session.difficulty === "pro").length;
  const totalMinutes = Math.floor((profile?.total_practice_time || 0) / 60);
  const streakDays = profile?.streak_days || 0;

  return [
    {
      id: "first-session",
      title: "Primeira Nota",
      description: "Registrar sua primeira pratica.",
      achieved: sessions.length > 0,
      progress: Math.min(sessions.length, 1),
      target: 1,
      tone: "gold",
    },
    {
      id: "five-day-streak",
      title: "Foco de 5 Dias",
      description: "Praticar em 5 dias seguidos.",
      achieved: streakDays >= 5,
      progress: Math.min(streakDays, 5),
      target: 5,
      tone: "emerald",
    },
    {
      id: "precision-90",
      title: "Precisao 90+",
      description: "Fazer 3 sessoes com 90%+.",
      achieved: highAccuracySessions >= 3,
      progress: Math.min(highAccuracySessions, 3),
      target: 3,
      tone: "cyan",
    },
    {
      id: "ten-completions",
      title: "Repertorio 10",
      description: "Concluir 10 musicas.",
      achieved: completedSessions >= 10,
      progress: Math.min(completedSessions, 10),
      target: 10,
      tone: "magenta",
    },
    {
      id: "one-hour",
      title: "Uma Hora Real",
      description: "Acumular 60 minutos de pratica.",
      achieved: totalMinutes >= 60,
      progress: Math.min(totalMinutes, 60),
      target: 60,
      tone: "cyan",
    },
    {
      id: "two-hands",
      title: "Duas Maos",
      description: "Tocar 5 sessoes com as duas maos.",
      achieved: bothHandsSessions >= 5,
      progress: Math.min(bothHandsSessions, 5),
      target: 5,
      tone: "emerald",
    },
    {
      id: "pro-mode",
      title: "Modo Pro",
      description: "Completar 3 sessoes profissionais.",
      achieved: proSessions >= 3,
      progress: Math.min(proSessions, 3),
      target: 3,
      tone: "magenta",
    },
  ];
}

export function buildPracticeGoals(profile: Profile | null, sessions: PracticeSession[]): PracticeGoal[] {
  const insight = buildPracticeProgressInsight(profile, sessions);
  const completedThisWeek = sessions.filter((session) => daysBetween(new Date(), new Date(session.created_at)) <= 6 && session.completed).length;

  return [
    {
      id: "weekly-sessions",
      title: "Sessoes na semana",
      current: insight.weeklySessions,
      target: 5,
      unit: "sessoes",
    },
    {
      id: "weekly-completions",
      title: "Musicas concluidas",
      current: completedThisWeek,
      target: 3,
      unit: "musicas",
    },
    {
      id: "recent-accuracy",
      title: "Precisao recente",
      current: insight.averageRecentAccuracy,
      target: insight.averageRecentAccuracy >= 88 ? 92 : 85,
      unit: "%",
    },
  ];
}

export function buildPracticeRecommendation(profile: Profile | null, sessions: PracticeSession[], catalog: Song[]): PracticeRecommendation | null {
  if (catalog.length === 0) return null;

  const recent = [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentAccuracies = recent.slice(0, 5).map((session) => Number(session.accuracy) || 0);
  const averageRecentAccuracy = average(recentAccuracies);
  const playedIds = new Set(recent.map((session) => session.song_id).filter(Boolean));
  const weakSession = recent.find((session) => session.song_id && (Number(session.accuracy) || 0) < 75);
  const weakSong = weakSession?.song_id ? catalog.find((song) => song.id === weakSession.song_id) : null;

  if (!profile || recent.length === 0) {
    const song = pickSong(catalog, (candidate) => isEasySong(candidate) && !candidate.isPremium) ?? pickSong(catalog, isEasySong);
    if (!song) return null;
    return {
      songId: song.id,
      songTitle: song.title,
      reason: "Comece por uma musica curta e facil para calibrar leitura, timing e captura.",
      difficulty: "beginner",
      handMode: "right",
      href: buildPlayHref(song.id, "beginner", "right"),
      label: "Primeira aula sugerida",
    };
  }

  if (weakSong) {
    const difficulty: Difficulty = weakSession?.difficulty === "pro" ? "medium" : "beginner";
    return {
      songId: weakSong.id,
      songTitle: weakSong.title,
      reason: "Essa musica apareceu com precisao baixa recentemente. Reforce com mao direita, modo espera e velocidade menor.",
      difficulty,
      handMode: "right",
      href: buildPlayHref(weakSong.id, difficulty, "right"),
      label: "Revisao recomendada",
    };
  }

  if (averageRecentAccuracy >= 88) {
    const unplayedMedium = pickSong(catalog, (candidate) => !playedIds.has(candidate.id) && !isEasySong(candidate), null);
    const song = unplayedMedium ?? pickSong(catalog, (candidate) => !playedIds.has(candidate.id), catalog[0]);
    if (!song) return null;
    const difficulty: Difficulty = averageRecentAccuracy >= 93 ? "pro" : "medium";
    const handMode = averageRecentAccuracy >= 90 ? "both" : "right";
    return {
      songId: song.id,
      songTitle: song.title,
      reason: "Seu desempenho recente permite um desafio maior sem perder controle.",
      difficulty,
      handMode,
      href: buildPlayHref(song.id, difficulty, handMode),
      label: "Novo desafio",
    };
  }

  const lastSong = recent[0]?.song_id ? catalog.find((song) => song.id === recent[0].song_id) : null;
  const song = lastSong ?? pickSong(catalog, (candidate) => isEasySong(candidate), catalog[0]);
  if (!song) return null;
  const handMode = recent.some((session) => session.hand_mode === "left") ? "right" : "left";

  return {
    songId: song.id,
    songTitle: song.title,
    reason: "Trabalhe equilibrio entre as maos mantendo uma musica conhecida.",
    difficulty: averageRecentAccuracy >= 78 ? "medium" : "beginner",
    handMode,
    href: buildPlayHref(song.id, averageRecentAccuracy >= 78 ? "medium" : "beginner", handMode),
    label: "Aula de equilibrio",
  };
}
