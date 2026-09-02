import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";

import {
  buildSubscriptionProfileUpdate,
  getExpandableId,
  getInvoicePaymentIntentId,
  getInvoiceSubscriptionId,
  getRefundInvoiceStatus,
  shouldRestoreDisputedCommission,
} from "../src/lib/stripe-webhook.ts";

function subscription(overrides: Partial<Stripe.Subscription> = {}) {
  return {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    trial_end: null,
    metadata: { userId: "user_123" },
    items: {
      data: [{ price: { recurring: { interval: "month" } } }],
    },
    ...overrides,
  } as Stripe.Subscription;
}

test("normalizes expandable Stripe identifiers", () => {
  assert.equal(getExpandableId("cus_123"), "cus_123");
  assert.equal(getExpandableId({ id: "cus_456" }), "cus_456");
  assert.equal(getExpandableId(null), null);
});

test("maps active subscriptions to paid profile state", () => {
  const result = buildSubscriptionProfileUpdate(subscription());

  assert.deepEqual(result, {
    customerId: "cus_123",
    userId: "user_123",
    values: {
      subscription_status: "active",
      stripe_subscription_id: "sub_123",
      stripe_customer_id: "cus_123",
      subscription_plan_interval: "month",
      trial_ends_at: null,
    },
  });
});

test("keeps the exact trial expiry only while a subscription is trialing", () => {
  const trialEnd = 1_800_000_000;
  const trialing = buildSubscriptionProfileUpdate(
    subscription({ status: "trialing", trial_end: trialEnd }),
  );
  const canceled = buildSubscriptionProfileUpdate(
    subscription({ status: "canceled", trial_end: trialEnd }),
  );

  assert.equal(trialing.values.trial_ends_at, new Date(trialEnd * 1000).toISOString());
  assert.equal(canceled.values.trial_ends_at, null);
});

test("rejects subscription events without a customer", () => {
  assert.throws(
    () => buildSubscriptionProfileUpdate(subscription({ customer: undefined })),
    /missing its customer/i,
  );
});

test("reads modern invoice subscription and payment intent references", () => {
  const invoice = {
    parent: { subscription_details: { subscription: "sub_456" } },
    payments: {
      data: [
        { payment: { type: "cash_balance" } },
        { payment: { type: "payment_intent", payment_intent: "pi_456" } },
      ],
    },
  } as unknown as Stripe.Invoice;

  assert.equal(getInvoiceSubscriptionId(invoice), "sub_456");
  assert.equal(getInvoicePaymentIntentId(invoice), "pi_456");
});

test("distinguishes partial and full refunds", () => {
  assert.equal(getRefundInvoiceStatus(10_000, 2_500), "partially_refunded");
  assert.equal(getRefundInvoiceStatus(10_000, 10_000), "refunded");
});

test("restores disputed commission only when the merchant wins", () => {
  assert.equal(shouldRestoreDisputedCommission("won"), true);
  assert.equal(shouldRestoreDisputedCommission("lost"), false);
  assert.equal(shouldRestoreDisputedCommission("warning_closed"), false);
});
