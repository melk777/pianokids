import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { getURL } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

export async function POST() {
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
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id || undefined;

    if (!customerId) {
      const sessions = await stripe.checkout.sessions.list({ limit: 100 });

      for (const session of sessions.data) {
        if (
          session.client_reference_id === userId ||
          session.metadata?.userId === userId
        ) {
          if (session.customer) {
            customerId =
              typeof session.customer === "string"
                ? session.customer
                : session.customer.id;
          }
          break;
        }
      }

      if (customerId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error("Configuracao segura do servidor ausente.");
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);

        if (profileUpdateError) {
          throw profileUpdateError;
        }
      }
    }

    if (!customerId) {
      return NextResponse.json(
        {
          error: "Nenhuma assinatura encontrada. Assine um plano antes de gerenciar.",
        },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getURL()}/dashboard/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: "Nao foi possivel abrir o portal da assinatura." },
      { status: 500 },
    );
  }
}
