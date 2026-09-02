import type Stripe from "stripe";

export function getExpandableId(value: { id: string } | string | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return getExpandableId(invoice.parent?.subscription_details?.subscription);
}

export function getInvoicePaymentIntentId(invoice: Stripe.Invoice) {
  const payment = invoice.payments?.data.find(
    (candidate) => candidate.payment.type === "payment_intent",
  );
  return getExpandableId(payment?.payment.payment_intent);
}

export function buildSubscriptionProfileUpdate(subscription: Stripe.Subscription) {
  const customerId = getExpandableId(subscription.customer);
  if (!customerId) throw new Error("Subscription is missing its customer.");

  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  return {
    customerId,
    userId: subscription.metadata?.userId || null,
    values: {
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      subscription_plan_interval:
        subscription.items.data[0]?.price.recurring?.interval ?? null,
      trial_ends_at: subscription.status === "trialing" ? trialEndsAt : null,
    },
  };
}

export function getRefundInvoiceStatus(amount: number, amountRefunded: number) {
  return amountRefunded >= amount ? "refunded" : "partially_refunded";
}

export function shouldRestoreDisputedCommission(status: Stripe.Dispute.Status) {
  return status === "won";
}
