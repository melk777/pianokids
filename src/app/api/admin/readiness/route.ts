import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ReadinessStatus = "pass" | "warn" | "fail";

interface ReadinessCheck {
  id: string;
  label: string;
  area: "env" | "supabase" | "stripe" | "legal" | "manual";
  status: ReadinessStatus;
  detail: string;
  action?: string;
}

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_MONTHLY_PRICE_ID",
  "STRIPE_YEARLY_PRICE_ID",
  "NEXT_PUBLIC_SITE_URL",
] as const;

function statusWeight(status: ReadinessStatus) {
  if (status === "fail") return 0;
  if (status === "warn") return 1;
  return 2;
}

function hasEnv(name: string) {
  return Boolean((process.env[name] || "").trim());
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

    const checks: ReadinessCheck[] = REQUIRED_ENV.map((name) => ({
      id: `env-${name}`,
      label: name,
      area: "env",
      status: hasEnv(name) ? "pass" : "fail",
      detail: hasEnv(name) ? "Configurada no ambiente atual." : "Ausente no ambiente atual.",
      action: hasEnv(name) ? undefined : "Adicionar na Vercel e redeployar.",
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    checks.push({
      id: "site-url-format",
      label: "URL publica do site",
      area: "env",
      status: siteUrl.startsWith("https://") ? "pass" : "warn",
      detail: siteUrl ? `Configurada como ${siteUrl}.` : "NEXT_PUBLIC_SITE_URL nao definida.",
      action: siteUrl.startsWith("https://") ? undefined : "Usar URL HTTPS final de producao.",
    });

    const serviceClient = getServiceClient();
    if (!serviceClient) {
      checks.push({
        id: "supabase-service-client",
        label: "Supabase service role",
        area: "supabase",
        status: "fail",
        detail: "Nao foi possivel criar cliente administrativo.",
        action: "Conferir SUPABASE_SERVICE_ROLE_KEY.",
      });
    } else {
      const { count: analyticsCount, error: analyticsError } = await serviceClient
        .from("analytics_events")
        .select("id", { count: "exact", head: true });

      checks.push({
        id: "analytics-table",
        label: "Tabela analytics_events",
        area: "supabase",
        status: analyticsError ? "fail" : analyticsCount && analyticsCount > 0 ? "pass" : "warn",
        detail: analyticsError
          ? analyticsError.message
          : `${analyticsCount ?? 0} eventos registrados.`,
        action: analyticsError
          ? "Rodar docs/analytics-events.sql no Supabase."
          : analyticsCount && analyticsCount > 0
            ? undefined
            : "Gerar alguns eventos navegando pelo site publicado.",
      });

      const { count: profileCount, error: profileError } = await serviceClient
        .from("profiles")
        .select("id", { count: "exact", head: true });

      checks.push({
        id: "profiles-table",
        label: "Tabela profiles",
        area: "supabase",
        status: profileError ? "fail" : "pass",
        detail: profileError ? profileError.message : `${profileCount ?? 0} perfis encontrados.`,
      });
    }

    checks.push({
      id: "stripe-price-ids",
      label: "Planos Stripe mensal/anual",
      area: "stripe",
      status: hasEnv("STRIPE_MONTHLY_PRICE_ID") && hasEnv("STRIPE_YEARLY_PRICE_ID") ? "pass" : "fail",
      detail: "Checkout depende dos Price IDs corretos.",
      action: "Conferir se os Price IDs sao do modo correto: teste ou producao.",
    });

    checks.push({
      id: "stripe-live-test",
      label: "Compra real ou teste completo",
      area: "manual",
      status: "warn",
      detail: "Depende de execucao manual: landing -> login -> checkout -> acesso Pro -> portal.",
      action: "Fazer antes de anunciar trafego pago.",
    });

    checks.push({
      id: "public-pages",
      label: "Paginas publicas de confianca",
      area: "legal",
      status: "pass",
      detail: "/termos, /privacidade, /reembolso e /contato estao implementadas.",
    });

    checks.push({
      id: "real-devices-qa",
      label: "QA em aparelhos reais",
      area: "manual",
      status: "warn",
      detail: "Teste em Android, iPhone, Windows/Mac e teclado/piano real ainda deve ser confirmado manualmente.",
      action: "Executar roteiro final antes do primeiro anuncio.",
    });

    const summary = checks.reduce(
      (acc, check) => {
        acc[check.status] += 1;
        return acc;
      },
      { pass: 0, warn: 0, fail: 0 },
    );

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      score: Math.round((summary.pass / checks.length) * 100),
      summary,
      checks: checks.sort((a, b) => statusWeight(a.status) - statusWeight(b.status)),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
