import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId } = body as { customerId: string };

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID é obrigatório" },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("Stripe portal error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
