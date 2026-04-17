import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { PracticeSession, Profile } from "@/lib/types";
import { buildPracticeAggregate, getBrazilPracticeDate } from "@/lib/practiceHistory";

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
  const supabase = await getSupabase();
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
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const payload = {
      user_id: user.id,
      song_id: typeof body.songId === "string" ? body.songId : null,
      song_title: typeof body.songTitle === "string" ? body.songTitle : null,
      difficulty: typeof body.difficulty === "string" ? body.difficulty : null,
      hand_mode: typeof body.handMode === "string" ? body.handMode : null,
      accuracy: Math.max(0, Math.min(100, Math.round(Number(body.accuracy) || 0))),
      score: Math.max(0, Math.round(Number(body.score) || 0)),
      combo: Math.max(0, Math.round(Number(body.combo) || 0)),
      duration_seconds: Math.max(0, Math.round(Number(body.durationSeconds) || 0)),
      completed: Boolean(body.completed),
      practiced_on: getBrazilPracticeDate(),
    };

    const { error: insertError } = await supabase.from("practice_sessions").insert(payload);

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
