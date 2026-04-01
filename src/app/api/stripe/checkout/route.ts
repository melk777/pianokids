import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/constants";

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
    const { planKey } = body as { planKey: keyof typeof PLANS };

    const plan = PLANS[planKey];
    if (!plan || !plan.priceId) {
      return NextResponse.json(
        { error: "Plano inválido ou price ID não configurado" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
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
