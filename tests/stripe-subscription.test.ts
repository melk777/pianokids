import assert from "node:assert/strict";
import test from "node:test";

import {
  pickRelevantSubscription,
  stripeSubscriptionHasPremium,
  subscriptionBlocksCheckout,
} from "../src/lib/stripe-subscription.ts";

test("only Stripe states with an unresolved subscription block a new checkout", () => {
  for (const status of ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]) {
    assert.equal(subscriptionBlocksCheckout(status), true, status);
  }
  assert.equal(subscriptionBlocksCheckout("canceled"), false);
  assert.equal(subscriptionBlocksCheckout("incomplete_expired"), false);
});

test("only active and trialing Stripe subscriptions unlock Pro", () => {
  assert.equal(stripeSubscriptionHasPremium("active"), true);
  assert.equal(stripeSubscriptionHasPremium("trialing"), true);
  assert.equal(stripeSubscriptionHasPremium("past_due"), false);
  assert.equal(stripeSubscriptionHasPremium("unpaid"), false);
});

test("the active subscription wins over newer canceled records", () => {
  const selected = pickRelevantSubscription([
    { status: "canceled", created: 300 },
    { status: "past_due", created: 200 },
    { status: "active", created: 100 },
  ]);

  assert.equal(selected?.status, "active");
});
