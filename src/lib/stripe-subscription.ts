export type StripeSubscriptionLike = {
  status: string;
  created?: number;
};

const CHECKOUT_BLOCKING_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

const PREMIUM_STATUSES = new Set(["active", "trialing"]);

const STATUS_PRIORITY = new Map([
  ["active", 0],
  ["trialing", 1],
  ["past_due", 2],
  ["unpaid", 3],
  ["incomplete", 4],
  ["paused", 5],
  ["canceled", 6],
  ["incomplete_expired", 7],
]);

export function subscriptionBlocksCheckout(status: string) {
  return CHECKOUT_BLOCKING_STATUSES.has(status);
}

export function stripeSubscriptionHasPremium(status: string) {
  return PREMIUM_STATUSES.has(status);
}

export function pickRelevantSubscription<T extends StripeSubscriptionLike>(
  subscriptions: T[],
): T | undefined {
  return [...subscriptions].sort((left, right) => {
    const statusDifference =
      (STATUS_PRIORITY.get(left.status) ?? 99) -
      (STATUS_PRIORITY.get(right.status) ?? 99);
    if (statusDifference !== 0) return statusDifference;
    return (right.created ?? 0) - (left.created ?? 0);
  })[0];
}
