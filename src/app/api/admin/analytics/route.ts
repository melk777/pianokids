import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AnalyticsEventName, AnalyticsProperties } from "@/lib/analytics";

export const dynamic = "force-dynamic";

interface AnalyticsRow {
  event: AnalyticsEventName;
  created_at: string;
  user_id: string | null;
  anonymous_id: string | null;
  path: string | null;
  properties: AnalyticsProperties | null;
}

const FUNNEL_STEPS: Array<{ event: AnalyticsEventName; label: string }> = [
  { event: "landing_view", label: "Visitas" },
  { event: "pricing_view", label: "Viu preço" },
  { event: "checkout_started", label: "Iniciou checkout" },
  { event: "auth_signup_completed", label: "Cadastro" },
  { event: "library_view", label: "Biblioteca" },
  { event: "song_started", label: "Iniciou música" },
  { event: "song_finished", label: "Concluiu música" },
];

function getActorId(row: AnalyticsRow) {
  return row.user_id || row.anonymous_id || `${row.event}-${row.created_at}`;
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabaseAdmin = getServiceClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from("analytics_events")
      .select("event, created_at, user_id, anonymous_id, path, properties")
      .gte("created_at", since30.toISOString())
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) throw error;

    const rows = (data || []) as AnalyticsRow[];
    const rows7 = rows.filter((row) => new Date(row.created_at) >= since7);
    const uniqueActors = new Set(rows.map(getActorId));
    const uniqueActors7 = new Set(rows7.map(getActorId));

    const countEvent = (event: AnalyticsEventName, source = rows) => source.filter((row) => row.event === event).length;
    const uniqueEvent = (event: AnalyticsEventName, source = rows) =>
      new Set(source.filter((row) => row.event === event).map(getActorId)).size;

    const funnel = FUNNEL_STEPS.map((step, index) => {
      const unique = uniqueEvent(step.event);
      const previous = index === 0 ? unique : uniqueEvent(FUNNEL_STEPS[index - 1].event);
      const visits = uniqueEvent("landing_view");

      return {
        ...step,
        count: countEvent(step.event),
        unique,
        conversionFromPrevious: index === 0 ? 100 : percent(unique, previous),
        conversionFromVisit: index === 0 ? 100 : percent(unique, visits),
      };
    });

    const topSongMap = new Map<string, { songId: string; title: string; starts: number; finishes: number }>();
    rows.forEach((row) => {
      if (row.event !== "song_started" && row.event !== "song_finished") return;
      const songId = typeof row.properties?.songId === "string" ? row.properties.songId : "unknown";
      const title = typeof row.properties?.title === "string" ? row.properties.title : songId;
      const current = topSongMap.get(songId) || { songId, title, starts: 0, finishes: 0 };
      if (row.event === "song_started") current.starts += 1;
      if (row.event === "song_finished") current.finishes += 1;
      topSongMap.set(songId, current);
    });

    const topSongs = Array.from(topSongMap.values())
      .map((song) => ({ ...song, completionRate: percent(song.finishes, song.starts) }))
      .sort((a, b) => b.starts - a.starts)
      .slice(0, 8);

    const daily = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (13 - index));
      const key = dayKey(date);
      const dayRows = rows.filter((row) => dayKey(new Date(row.created_at)) === key);

      return {
        date: key.slice(5),
        visits: countEvent("landing_view", dayRows),
        checkouts: countEvent("checkout_started", dayRows),
        songStarts: countEvent("song_started", dayRows),
        songFinishes: countEvent("song_finished", dayRows),
      };
    });

    const recentEvents = rows.slice(0, 18).map((row) => ({
      event: row.event,
      createdAt: row.created_at,
      path: row.path,
      actor: row.user_id ? "user" : "anonymous",
      songId: typeof row.properties?.songId === "string" ? row.properties.songId : null,
      source: typeof row.properties?.source === "string" ? row.properties.source : null,
    }));

    return NextResponse.json({
      windowDays: 30,
      totals: {
        events: rows.length,
        events7Days: rows7.length,
        uniqueVisitors: uniqueActors.size,
        uniqueVisitors7Days: uniqueActors7.size,
        checkoutStarts: countEvent("checkout_started"),
        signups: countEvent("auth_signup_completed"),
        songStarts: countEvent("song_started"),
        songFinishes: countEvent("song_finished"),
        tutorialCompletions: countEvent("tutorial_completed"),
      },
      funnel,
      topSongs,
      daily,
      recentEvents,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
