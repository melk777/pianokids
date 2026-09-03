import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateTeacherBalances,
  summarizeAdminCosts,
} from "../src/lib/dashboard-financial.ts";

const now = new Date("2026-09-03T12:00:00.000Z");

test("teacher balance separates available, pending and already settled commissions", () => {
  const result = calculateTeacherBalances([
    { amount: 5, available_at: "2026-09-01T12:00:00.000Z" },
    { amount: "40", available_at: "2026-10-01T12:00:00.000Z" },
    { amount: 5, available_at: "2026-08-01T12:00:00.000Z", withdrawal_id: "withdrawal-1" },
    { amount: -5, available_at: "2026-09-02T12:00:00.000Z", settled_at: "2026-09-02T13:00:00.000Z" },
  ], now);

  assert.deepEqual(result, {
    balanceAvailable: 5,
    balancePending: 40,
    estimatedEarnings: 45,
  });
});

test("negative reversals never expose a negative withdrawable balance", () => {
  const result = calculateTeacherBalances([
    { amount: 5, available_at: "2026-09-01T12:00:00.000Z" },
    { amount: -10, available_at: "2026-09-02T12:00:00.000Z" },
  ], now);

  assert.equal(result.balanceAvailable, 0);
  assert.equal(result.balancePending, 0);
  assert.equal(result.estimatedEarnings, -5);
});

test("admin cost summary does not count Stripe fees twice", () => {
  assert.deepEqual(
    summarizeAdminCosts({
      gatewayAndManualCosts: 180,
      gatewayCosts: 30,
      teacherCommissions: 70,
    }),
    { manualCosts: 150, totalCosts: 250 },
  );
});
