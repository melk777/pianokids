import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/server/supabase";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function getExpandableId(value: { id: string } | string | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return getExpandableId(invoice.parent?.subscription_details?.subscription);
}

function getInvoicePaymentIntentId(invoice: Stripe.Invoice) {
  const payment = invoice.payments?.data.find(
    (candidate) => candidate.payment.type === "payment_intent",
  );
  return getExpandableId(payment?.payment.payment_intent);
}

async function findInvoiceIdForCharge(stripe: Stripe, charge: Stripe.Charge) {
  const paymentIntentId = getExpandableId(charge.payment_intent);
  if (!paymentIntentId) return null;

  const invoicePayments = await stripe.invoicePayments.list({
    payment: { type: "payment_intent", payment_intent: paymentIntentId },
    limit: 1,
  });
  return getExpandableId(invoicePayments.data[0]?.invoice);
}

async function getInvoiceBalanceAmounts(
  stripe: Stripe,
  paymentIntentId: string | null,
  amountPaid: number,
) {
  if (!paymentIntentId) {
    return { feeAmount: 0, netAmount: amountPaid };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId = getExpandableId(paymentIntent.latest_charge);
    if (!chargeId) return { feeAmount: 0, netAmount: amountPaid };

    const charge = await stripe.charges.retrieve(chargeId);
    const balanceTransactionId = getExpandableId(charge.balance_transaction);
    if (!balanceTransactionId) return { feeAmount: 0, netAmount: amountPaid };

    const balanceTransaction = await stripe.balanceTransactions.retrieve(
      balanceTransactionId,
    );
    return {
      feeAmount: balanceTransaction.fee,
      netAmount: balanceTransaction.net,
    };
  } catch (error) {
    console.warn("Could not load Stripe balance transaction for invoice:", error);
    return { feeAmount: 0, netAmount: amountPaid };
  }
}

async function updateProfileFromSubscription(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) {
  const customerId = getExpandableId(subscription.customer);
  if (!customerId) throw new Error("Subscription is missing its customer.");

  const userId = subscription.metadata?.userId;
  const interval = subscription.items.data[0]?.price.recurring?.interval ?? null;
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  let query = supabase.from("profiles").update({
    subscription_status: subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    subscription_plan_interval: interval,
    trial_ends_at: subscription.status === "trialing" ? trialEndsAt : null,
  });
  query = userId ? query.eq("id", userId) : query.eq("stripe_customer_id", customerId);

  const { error } = await query;
  if (error) throw error;
}

async function resolveCharge(stripe: Stripe, value: string | Stripe.Charge) {
  return typeof value === "string" ? stripe.charges.retrieve(value) : value;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured.");
    return NextResponse.json({ error: "Webhook unavailable." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook verification failed";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const eventObject = event.data.object as { id?: string };
  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_stripe_webhook_event",
    {
      p_event_id: event.id,
      p_event_type: event.type,
      p_object_id: eventObject.id ?? null,
      p_livemode: event.livemode,
    },
  );

  if (claimError) {
    console.error("Could not claim Stripe webhook event:", claimError);
    return NextResponse.json({ error: "Webhook ledger unavailable." }, { status: 503 });
  }
  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        const customerId = getExpandableId(session.customer);
        const subscriptionId = getExpandableId(session.subscription);
        if (!userId || !customerId || !subscriptionId) {
          throw new Error("Checkout session is missing user, customer, or subscription metadata.");
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.metadata?.userId && subscription.metadata.userId !== userId) {
          throw new Error("Checkout and subscription user metadata do not match.");
        }
        await updateProfileFromSubscription(supabase, subscription);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await updateProfileFromSubscription(
          supabase,
          event.data.object as Stripe.Subscription,
        );
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = getExpandableId(invoice.customer);
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (!customerId) throw new Error("Paid invoice is missing its customer.");

        let subscription: Stripe.Subscription | null = null;
        if (subscriptionId) {
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await updateProfileFromSubscription(supabase, subscription);
        }

        const paymentIntentId = getInvoicePaymentIntentId(invoice);
        const { feeAmount, netAmount } = await getInvoiceBalanceAmounts(
          stripe,
          paymentIntentId,
          invoice.amount_paid,
        );

        const { error } = await supabase.rpc("record_paid_invoice", {
          p_invoice_id: invoice.id,
          p_customer_id: customerId,
          p_subscription_id: subscriptionId,
          p_payment_intent_id: paymentIntentId,
          p_amount_paid: invoice.amount_paid,
          p_fee_amount: feeAmount,
          p_net_amount: netAmount,
          p_currency: invoice.currency,
          p_paid_at: new Date(
            (invoice.status_transitions.paid_at ?? invoice.created) * 1000,
          ).toISOString(),
          p_plan_interval:
            subscription?.items.data[0]?.price.recurring?.interval ?? null,
          p_user_id:
            subscription?.metadata?.userId ??
            invoice.parent?.subscription_details?.metadata?.userId ??
            null,
        });
        if (error) throw error;
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = getExpandableId(invoice.customer);
        if (customerId) {
          const { error } = await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);
          if (error) throw error;
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const invoiceId = await findInvoiceIdForCharge(stripe, charge);
        if (invoiceId) {
          const { error } = await supabase.rpc("record_commission_reversal", {
            p_invoice_id: invoiceId,
            p_reference: event.id,
            p_source_type: "refund",
            p_refunded_amount: charge.amount_refunded,
            p_invoice_status:
              charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded",
          });
          if (error) throw error;
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = await resolveCharge(stripe, dispute.charge);
        const invoiceId = await findInvoiceIdForCharge(stripe, charge);
        if (invoiceId) {
          const { error } = await supabase.rpc("record_commission_reversal", {
            p_invoice_id: invoiceId,
            p_reference: dispute.id,
            p_source_type: "dispute",
            p_refunded_amount: dispute.amount,
            p_invoice_status: "disputed",
          });
          if (error) throw error;
        }
        break;
      }

      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        if (dispute.status === "won") {
          const charge = await resolveCharge(stripe, dispute.charge);
          const invoiceId = await findInvoiceIdForCharge(stripe, charge);
          if (invoiceId) {
            const { error } = await supabase.rpc("restore_disputed_commission", {
              p_invoice_id: invoiceId,
              p_reference: dispute.id,
            });
            if (error) throw error;
          }
        }
        break;
      }

      default:
        break;
    }

    const { error: completionError } = await supabase
      .from("stripe_webhook_events")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", event.id);
    if (completionError) throw completionError;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "failed", last_error: message.slice(0, 2000), updated_at: new Date().toISOString() })
      .eq("event_id", event.id);

    console.error("Stripe webhook persistence failed:", {
      eventId: event.id,
      eventType: event.type,
      error,
    });
    return NextResponse.json({ error: "Webhook persistence failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
