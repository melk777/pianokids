import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
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
      const userId = session.metadata?.userId || session.client_reference_id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      
      console.log("✅ Checkout completed:", {
        sessionId: session.id,
        userId,
        customerId,
      });

      if (userId) {
        // Importante: No checkout.session.completed, o customerId é essencial
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
          })
          .eq("id", userId);

        if (error) console.error("❌ Erro ao atualizar perfil no checkout.completed:", error);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      
      console.log("🔄 Subscription updated:", {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId,
      });

      // Aqui buscamos pelo stripe_customer_id, já que não temos o userId diretamente no evento de sub
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status === "active" ? "active" : subscription.status,
          stripe_subscription_id: subscription.id,
        })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("❌ Erro ao atualizar perfil no subscription.updated:", error);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

      console.log("❌ Subscription cancelled:", {
        subscriptionId: subscription.id,
        customerId,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
        })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("❌ Erro ao atualizar perfil no subscription.deleted:", error);
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
