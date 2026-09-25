import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/server/supabase";
import { evaluateStripeEnvironment } from "@/lib/stripe-environment";

export const dynamic = "force-dynamic";

const REQUIRED_ENVIRONMENT = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_MONTHLY_PRICE_ID",
  "STRIPE_YEARLY_PRICE_ID",
  "NEXT_PUBLIC_SITE_URL",
  "COMPANY_LEGAL_NAME",
  "COMPANY_TAX_ID",
  "COMPANY_ADDRESS",
] as const;

export async function GET() {
  const missing = REQUIRED_ENVIRONMENT.filter((name) => !process.env[name]?.trim());
  let database = "not_checked";
  const stripeEnvironment = evaluateStripeEnvironment({
    key: process.env.STRIPE_SECRET_KEY,
    vercelEnvironment: process.env.VERCEL_ENV,
    nodeEnvironment: process.env.NODE_ENV,
  });

  if (missing.length === 0) {
    try {
      const admin = createSupabaseAdminClient();
      const schemaChecks = await Promise.all([
        admin.from("profiles").select("id, terms_version").limit(1),
        admin.from("billing_invoices").select("stripe_invoice_id").limit(1),
        admin.from("teacher_commission_entries").select("id").limit(1),
        admin.from("stripe_webhook_events").select("event_id").limit(1),
      ]);
      const schemaError = schemaChecks.find((check) => check.error)?.error;
      if (schemaError) throw schemaError;
      database = "reachable";
    } catch (error) {
      database = "unreachable";
      console.error("Health database check failed:", error);
    }
  }

  const productionReady =
    missing.length === 0 && database === "reachable" && stripeEnvironment.ok;
  const healthy = process.env.NODE_ENV === "production" ? productionReady : true;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "unready",
      service: "pianify",
      timestamp: new Date().toISOString(),
      checks: {
        configuration: missing.length === 0 ? "complete" : "incomplete",
        database,
        stripeEnvironment: stripeEnvironment.ok ? "safe" : "unsafe",
      },
      ...(missing.length > 0 && process.env.NODE_ENV !== "production"
        ? { missingConfiguration: missing }
        : {}),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
