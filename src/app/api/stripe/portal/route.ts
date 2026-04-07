import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
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
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const stripe = getStripe();

    // Buscar customer pelas subscriptions ativas (via checkout sessions)
    // Listamos sessions recentes e encontramos a que pertence ao userId
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });

    let customerId: string | undefined;

    for (const session of sessions.data) {
      if (
        session.client_reference_id === userId ||
        session.metadata?.userId === userId ||
        session.metadata?.clerkUserId === userId
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

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "Nenhuma assinatura encontrada. Assine um plano antes de gerenciar.",
        },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("Stripe portal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
