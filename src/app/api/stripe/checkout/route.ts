import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // ── Se o usuário NÃO está logado, retorna para o novo login ──
    if (!userId) {
      return NextResponse.json(
        {
          redirect: "/login",
          message: "Faça login para assinar um plano.",
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

    console.log("DEBUG: Iniciando checkout para:", planKey, "com Price ID:", priceId);

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

    console.log("DEBUG: Checkout session criada com sucesso:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("DEBUG STRIPE ERROR:", err); // Log completo para ver o objeto de erro
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
