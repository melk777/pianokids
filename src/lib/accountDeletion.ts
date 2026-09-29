/**
 * Account deletion rules, kept free of I/O so they can be tested.
 *
 * - Students (and anyone without a special role) delete immediately: the Stripe
 *   subscription is cancelled first so nothing is charged after the account is gone.
 * - Teachers hold commissions and withdrawals that are fiscal records, so their
 *   deletion is a request that support settles before closing the account.
 * - Admins cannot delete themselves from the app.
 */

export const DELETE_CONFIRMATION = "EXCLUIR";

export type DeletionMode = "delete" | "request" | "blocked";

export function deletionModeFor(role: string | null | undefined): DeletionMode {
  if (role === "admin") return "blocked";
  if (role === "teacher") return "request";
  return "delete";
}

export function isDeletionConfirmed(value: unknown) {
  return typeof value === "string" && value.trim().toUpperCase() === DELETE_CONFIRMATION;
}

/** Stripe statuses that can still produce a charge and must be cancelled. */
const BILLABLE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);

export function subscriptionNeedsCancel(status: string) {
  return BILLABLE_STATUSES.has(status);
}

/**
 * The request must come from the site itself: the cookie session alone would let
 * another site trigger a deletion from a logged-in browser.
 */
export function isSameOriginRequest(origin: string | null, host: string | null) {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Avatar files are stored as `<userId>-<timestamp>.<ext>` at the bucket root. */
export function isOwnAvatarFile(name: string, userId: string) {
  return name.startsWith(`${userId}-`);
}
