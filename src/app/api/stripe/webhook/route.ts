import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getWebhookSupabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase service role environment variables are missing for Stripe webhook.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured.");
    return NextResponse.json({ error: "Webhook unavailable." }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const supabase = getWebhookSupabase();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (!userId || !customerId) {
          throw new Error("Checkout session is missing user or customer metadata.");
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const subscription = subscriptionId
          ? await stripe.subscriptions.retrieve(subscriptionId)
          : null;

        const { error } = await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription?.status,
            subscription_plan_interval:
              subscription?.items.data[0]?.price.recurring?.interval ?? null,
          })
          .eq("id", userId);

        if (error) throw error;
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const billingInterval = subscription.items.data[0]?.price.recurring?.interval ?? null;
        const userId = subscription.metadata?.userId;

        let updateQuery = supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            subscription_plan_interval: billingInterval,
          });

        updateQuery = userId
          ? updateQuery.eq("id", userId)
          : updateQuery.eq("stripe_customer_id", customerId);

        const { error } = await updateQuery;

        if (error) throw error;
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const { error } = await supabase
          .from("profiles")
          .update({ subscription_status: "canceled" })
          .eq("stripe_customer_id", customerId);

        if (error) throw error;
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          const { error } = await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);

          if (error) throw error;
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook persistence failed:", {
      eventId: event.id,
      eventType: event.type,
      error,
    });
    return NextResponse.json({ error: "Webhook persistence failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
