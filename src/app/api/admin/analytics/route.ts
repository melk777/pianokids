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

interface FunnelStep {
  event: AnalyticsEventName;
  label: string;
  count: number;
  unique: number;
  conversionFromPrevious: number;
  conversionFromVisit: number;
}

interface GrowthAlert {
  id: string;
  title: string;
  severity: "critical" | "warning" | "opportunity" | "healthy";
  metric: string;
  diagnosis: string;
  action: string;
  owner: "landing" | "checkout" | "activation" | "retention" | "data";
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

function findStep(funnel: FunnelStep[], event: AnalyticsEventName) {
  return funnel.find((step) => step.event === event);
}

function buildGrowthAlerts(funnel: FunnelStep[], topSongs: Array<{ starts: number; finishes: number; completionRate: number }>): GrowthAlert[] {
  const visits = findStep(funnel, "landing_view")?.unique ?? 0;
  const pricing = findStep(funnel, "pricing_view")?.unique ?? 0;
  const checkout = findStep(funnel, "checkout_started")?.unique ?? 0;
  const signup = findStep(funnel, "auth_signup_completed")?.unique ?? 0;
  const library = findStep(funnel, "library_view")?.unique ?? 0;
  const songStarted = findStep(funnel, "song_started")?.unique ?? 0;
  const songFinished = findStep(funnel, "song_finished")?.unique ?? 0;
  const alerts: GrowthAlert[] = [];

  if (visits < 30) {
    alerts.push({
      id: "low-sample",
      title: "Amostra ainda pequena",
      severity: "opportunity",
      metric: `${visits} visitantes unicos em 30 dias`,
      diagnosis: "Os dados ja funcionam, mas ainda ha pouco volume para conclusoes definitivas.",
      action: "Priorize trafego qualificado e acompanhe os proximos 100 visitantes antes de mudar preco ou promessa principal.",
      owner: "data",
    });
  }

  const pricingRate = percent(pricing, visits);
  if (visits >= 20 && pricingRate < 35) {
    alerts.push({
      id: "landing-to-pricing",
      title: "Pouca gente chega no preco",
      severity: pricingRate < 20 ? "critical" : "warning",
      metric: `${pricingRate}% das visitas viram a oferta`,
      diagnosis: "A primeira dobra pode nao estar levando o visitante rapido o bastante para a decisao comercial.",
      action: "Teste um CTA mais direto no hero, reduza distracoes antes da oferta e mostre prova clara do pianoengine ainda no primeiro scroll.",
      owner: "landing",
    });
  }

  const checkoutRate = percent(checkout, pricing);
  if (pricing >= 10 && checkoutRate < 18) {
    alerts.push({
      id: "pricing-to-checkout",
      title: "Oferta nao esta puxando checkout",
      severity: checkoutRate < 8 ? "critical" : "warning",
      metric: `${checkoutRate}% de preco para checkout`,
      diagnosis: "O visitante demonstra interesse, mas ainda nao sente seguranca ou urgencia suficiente para iniciar compra.",
      action: "Adicione garantia, comparacao com aula particular, beneficios objetivos e uma chamada anual/mensal mais clara.",
      owner: "checkout",
    });
  }

  const signupRate = percent(signup, checkout);
  if (checkout >= 8 && signupRate < 45) {
    alerts.push({
      id: "checkout-to-signup",
      title: "Atrito entre checkout e cadastro",
      severity: signupRate < 25 ? "critical" : "warning",
      metric: `${signupRate}% de checkout para cadastro`,
      diagnosis: "O usuario inicia a intencao de compra, mas pode estar encontrando friccao no login, captcha, preco final ou redirecionamento.",
      action: "Revise o fluxo mobile de login, mensagens de erro, tempo do Stripe e clareza do que acontece depois de pagar.",
      owner: "checkout",
    });
  }

  const activationRate = percent(songStarted, library);
  if (library >= 10 && activationRate < 55) {
    alerts.push({
      id: "library-to-song",
      title: "Aluno chega na biblioteca mas nao toca",
      severity: activationRate < 35 ? "critical" : "warning",
      metric: `${activationRate}% da biblioteca inicia uma musica`,
      diagnosis: "A escolha da primeira musica pode estar exigindo decisao demais ou a recomendacao inicial nao esta forte o suficiente.",
      action: "Destaque uma aula recomendada acima das categorias, simplifique filtros para iniciantes e use o onboarding para abrir a primeira musica.",
      owner: "activation",
    });
  }

  const completionRate = percent(songFinished, songStarted);
  if (songStarted >= 10 && completionRate < 35) {
    alerts.push({
      id: "song-completion",
      title: "Muita gente inicia, pouca gente conclui",
      severity: completionRate < 20 ? "critical" : "warning",
      metric: `${completionRate}% de conclusao das musicas`,
      diagnosis: "A primeira experiencia pode estar dificil, longa, confusa ou sem recompensa rapida.",
      action: "Use musicas mais curtas para primeira aula, reduza dificuldade padrao e mostre progresso mesmo quando o aluno erra.",
      owner: "retention",
    });
  }

  const averageTopCompletion = topSongs.length
    ? percent(topSongs.reduce((sum, song) => sum + song.finishes, 0), topSongs.reduce((sum, song) => sum + song.starts, 0))
    : 0;

  if (topSongs.length >= 3 && averageTopCompletion >= 55) {
    alerts.push({
      id: "winning-songs",
      title: "Ha musicas boas para usar em anuncio",
      severity: "healthy",
      metric: `${averageTopCompletion}% de conclusao nas musicas mais tocadas`,
      diagnosis: "Algumas musicas ja estao provando tracao dentro do produto.",
      action: "Use as musicas com maior conclusao em criativos, exemplos da landing e primeira recomendacao do onboarding.",
      owner: "landing",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "healthy-funnel",
      title: "Funil sem gargalo critico no momento",
      severity: "healthy",
      metric: "Conversoes dentro do esperado para a amostra atual",
      diagnosis: "Nenhuma etapa passou dos limites de alerta configurados.",
      action: "Continue coletando dados e teste uma melhoria por vez para descobrir o que mais aumenta conversao.",
      owner: "data",
    });
  }

  const severityWeight = { critical: 0, warning: 1, opportunity: 2, healthy: 3 };
  return alerts.sort((a, b) => severityWeight[a.severity] - severityWeight[b.severity]).slice(0, 6);
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
    const alerts = buildGrowthAlerts(funnel, topSongs);

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
      alerts,
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
