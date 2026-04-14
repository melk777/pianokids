import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);
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
      return_url: `${req.nextUrl.origin}/dashboard/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("Stripe portal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
