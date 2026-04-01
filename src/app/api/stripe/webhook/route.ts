import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("✅ Checkout completed:", {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        metadata: session.metadata,
      });
      // TODO: Ativar assinatura do usuário no banco de dados
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("🔄 Subscription updated:", {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer,
      });
      // TODO: Atualizar status da assinatura no banco de dados
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("❌ Subscription cancelled:", {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      });
      // TODO: Desativar assinatura do usuário no banco de dados
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("⚠️ Payment failed:", {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      });
      // TODO: Notificar usuário sobre falha no pagamento
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
