import assert from "node:assert/strict";
import test from "node:test";
import { evaluateStripeEnvironment, getStripeKeyMode } from "../src/lib/stripe-environment.ts";

test("identifies live and test Stripe keys without exposing their values", () => {
  assert.equal(getStripeKeyMode("sk_live_example"), "live");
  assert.equal(getStripeKeyMode("sk_test_example"), "test");
  assert.equal(getStripeKeyMode("rk_live_example"), "live");
  assert.equal(getStripeKeyMode("rk_test_example"), "test");
  assert.equal(getStripeKeyMode("  rk_live_example  "), "live");
  assert.equal(getStripeKeyMode("invalid"), "unknown");
  assert.equal(getStripeKeyMode(undefined), "unknown");
});

test("allows live Stripe only in Vercel production", () => {
  assert.equal(
    evaluateStripeEnvironment({
      key: "sk_live_example",
      vercelEnvironment: "production",
      nodeEnvironment: "production",
    }).ok,
    true,
  );
  assert.equal(
    evaluateStripeEnvironment({
      key: "sk_live_example",
      vercelEnvironment: "preview",
      nodeEnvironment: "production",
    }).ok,
    false,
  );
});

test("rejects test Stripe keys in Vercel production", () => {
  assert.equal(
    evaluateStripeEnvironment({
      key: "sk_test_example",
      vercelEnvironment: "production",
      nodeEnvironment: "production",
    }).ok,
    false,
  );
  assert.equal(
    evaluateStripeEnvironment({
      key: "sk_test_example",
      vercelEnvironment: "preview",
      nodeEnvironment: "production",
    }).ok,
    true,
  );
});

test("blocks live Stripe keys during local development", () => {
  assert.equal(
    evaluateStripeEnvironment({
      key: "sk_live_example",
      vercelEnvironment: undefined,
      nodeEnvironment: "development",
    }).ok,
    false,
  );
});
