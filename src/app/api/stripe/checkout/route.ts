import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    // ── Se o usuário NÃO está logado, retorna redirect para cadastro ──
    if (!userId) {
      return NextResponse.json(
        {
          redirect: "/sign-up",
          message: "Crie uma conta antes de assinar um plano.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { planKey } = body as { planKey: "monthly" | "yearly" };

    // Pegamos os IDs de forma DINÂMICA do ambiente para garantir que o server sempre os encontre
    const priceId = planKey === "monthly" 
      ? process.env.STRIPE_MONTHLY_PRICE_ID 
      : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      console.error(`ERRO: STRIPE_${planKey.toUpperCase()}_PRICE_ID não configurado no servidor.`);
      return NextResponse.json(
        { error: "Erro de configuração: Price ID não encontrado no servidor." },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/#pricing`,
      client_reference_id: userId,
      metadata: {
        planKey,
        clerkUserId: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
