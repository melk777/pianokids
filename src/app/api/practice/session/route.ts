import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { PracticeSession, Profile } from "@/lib/types";
import { buildPracticeAggregate, getBrazilPracticeDate } from "@/lib/practiceHistory";
import { canAccessSong, hasSpecialAccess } from "@/lib/access-control";
import { createSupabaseAdminClient } from "@/lib/server/supabase";
import { getServerSongMetadata } from "@/lib/server/song-catalog";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function isMissingPracticeSessionsTable(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01",
  );
}

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

async function loadSessionData(userId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const sessions = (data ?? []) as PracticeSession[];
  return {
    sessions,
    aggregate: buildPracticeAggregate(sessions),
    recentSessions: sessions.slice(0, 12),
  };
}

async function syncProfileAggregate(userId: string, aggregate: ReturnType<typeof buildPracticeAggregate>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configuracao segura do servidor ausente.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const updates: Partial<Profile> = {
    total_practice_time: aggregate.totalPracticeTime,
    songs_played: aggregate.songsPlayed,
    songs_completed: aggregate.songsCompleted,
    average_accuracy: aggregate.averageAccuracy,
    streak_days: aggregate.streakDays,
    last_practice_date: aggregate.lastPracticeDate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ supported: false, aggregate: null, recentSessions: [] });
  }

  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await loadSessionData(user.id);
    return NextResponse.json({
      supported: true,
      aggregate: snapshot.aggregate,
      recentSessions: snapshot.recentSessions,
    });
  } catch (error) {
    if (isMissingPracticeSessionsTable(error)) {
      return NextResponse.json({ supported: false, aggregate: null, recentSessions: [] });
    }

    console.error("practice session GET error:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar o historico." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Historico de pratica indisponivel neste ambiente." },
      { status: 503 },
    );
  }

  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const songId = typeof body.songId === "string" ? body.songId.trim() : "";
    if (!songId || songId.length > 120 || songId === "freeplay") {
      return NextResponse.json({ error: "Música inválida para o histórico." }, { status: 400 });
    }

    const [song, profileResult] = await Promise.all([
      getServerSongMetadata(songId),
      supabase
        .from("profiles")
        .select("role, subscription_status, trial_ends_at")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (!song) {
      return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
    }
    if (profileResult.error) throw profileResult.error;
    if (!profileResult.data || profileResult.data.role !== "student") {
      return NextResponse.json({ error: "Apenas alunos podem registrar prática." }, { status: 403 });
    }
    if (
      !canAccessSong(song, profileResult.data, {
        hasSpecialAccess: hasSpecialAccess(user.id, user.email),
      })
    ) {
      return NextResponse.json({ error: "Seu plano não dá acesso a esta música." }, { status: 403 });
    }

    const allowedDifficulties = new Set(["beginner", "medium", "pro"]);
    const allowedHandModes = new Set(["left", "right", "both", "unknown"]);
    const difficulty = typeof body.difficulty === "string" && allowedDifficulties.has(body.difficulty)
      ? body.difficulty
      : "beginner";
    const handMode = typeof body.handMode === "string" && allowedHandModes.has(body.handMode)
      ? body.handMode
      : "unknown";
    const maximumDuration = Math.max(60, Math.ceil((Number(song.duration) || 0) * 2 + 60));
    const supabaseAdmin = createSupabaseAdminClient();

    const fiveSecondsAgo = new Date(Date.now() - 5_000).toISOString();
    const { data: recentDuplicate, error: duplicateCheckError } = await supabaseAdmin
      .from("practice_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("song_id", song.id)
      .gte("created_at", fiveSecondsAgo)
      .limit(1)
      .maybeSingle();

    if (duplicateCheckError) throw duplicateCheckError;
    if (recentDuplicate) {
      return NextResponse.json({ error: "Esta sessão já foi registrada." }, { status: 409 });
    }

    const payload = {
      user_id: user.id,
      song_id: song.id,
      song_title: song.title,
      difficulty,
      hand_mode: handMode,
      accuracy: Math.max(0, Math.min(100, Math.round(Number(body.accuracy) || 0))),
      score: Math.max(0, Math.min(10_000_000, Math.round(Number(body.score) || 0))),
      combo: Math.max(0, Math.min(100_000, Math.round(Number(body.combo) || 0))),
      duration_seconds: Math.max(0, Math.min(maximumDuration, Math.round(Number(body.durationSeconds) || 0))),
      completed: Boolean(body.completed),
      practiced_on: getBrazilPracticeDate(),
    };

    const { error: insertError } = await supabaseAdmin.from("practice_sessions").insert(payload);

    if (insertError) {
      throw insertError;
    }

    const snapshot = await loadSessionData(user.id);
    const profile = await syncProfileAggregate(user.id, snapshot.aggregate);

    return NextResponse.json({
      supported: true,
      aggregate: snapshot.aggregate,
      recentSessions: snapshot.recentSessions,
      profile,
    });
  } catch (error) {
    if (isMissingPracticeSessionsTable(error)) {
      return NextResponse.json(
        { supported: false, error: "Tabela practice_sessions ausente. Rode a migracao SQL antes de usar o historico." },
        { status: 503 },
      );
    }

    console.error("practice session POST error:", error);
    return NextResponse.json({ error: "Nao foi possivel registrar a sessao." }, { status: 500 });
  }
}
