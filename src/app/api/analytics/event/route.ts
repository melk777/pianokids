import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { AnalyticsPayload } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "pricing_view",
  "checkout_started",
  "checkout_redirected",
  "auth_login_started",
  "auth_login_completed",
  "auth_signup_started",
  "auth_signup_completed",
  "onboarding_completed",
  "onboarding_skipped",
  "library_view",
  "song_card_opened",
  "song_locked_clicked",
  "song_started",
  "tutorial_completed",
  "song_finished",
  "score_restart_clicked",
  "recommended_practice_clicked",
]);

function sanitizeProperties(properties: unknown) {
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return {};

  return Object.fromEntries(
    Object.entries(properties as Record<string, unknown>)
      .slice(0, 40)
      .filter(([key, value]) => {
        if (key.length > 80) return false;
        return (
          value === null ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        );
      })
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 500) : value]),
  );
}

async function getUserId() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isMissingAnalyticsTable(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01",
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as AnalyticsPayload;

    if (!ALLOWED_EVENTS.has(payload.event)) {
      return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    }

    const headerStore = await headers();
    const userId = await getUserId();
    const supabaseAdmin = getAdminClient();
    const event = {
      event: payload.event,
      user_id: userId,
      anonymous_id: typeof payload.anonymousId === "string" ? payload.anonymousId.slice(0, 120) : null,
      path: typeof payload.path === "string" ? payload.path.slice(0, 500) : request.nextUrl.pathname,
      referrer: typeof payload.referrer === "string" ? payload.referrer.slice(0, 500) : null,
      properties: sanitizeProperties(payload.properties),
      user_agent: headerStore.get("user-agent")?.slice(0, 500) ?? null,
      ip_hash_source: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 80) ?? null,
    };

    if (!supabaseAdmin) {
      return NextResponse.json({ accepted: true, persisted: false, reason: "missing_service_role" });
    }

    const { error } = await supabaseAdmin.from("analytics_events").insert(event);

    if (error) {
      if (isMissingAnalyticsTable(error)) {
        return NextResponse.json({ accepted: true, persisted: false, reason: "missing_table" });
      }

      console.error("analytics event insert error:", error);
      return NextResponse.json({ accepted: true, persisted: false, reason: "insert_error" });
    }

    return NextResponse.json({ accepted: true, persisted: true });
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }
}
