import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// Importar PLANS só no server — nunca re-exportar para o client
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { planKey?: string };
    const { planKey } = body;

    if (!planKey || !(planKey in PLAN_PRICE_IDS)) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const priceId = PLAN_PRICE_IDS[planKey];
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID para o plano "${planKey}" não configurado. Adicione STRIPE_${planKey.toUpperCase()}_PRICE_ID nas variáveis de ambiente.` },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/#pricing`,
      metadata: { planKey },
    });

    if (!session.url) {
      throw new Error("Stripe não retornou uma URL de checkout.");
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno no servidor.";
    console.error("[stripe/checkout] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
