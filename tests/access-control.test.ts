import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessSong,
  hasPremiumAccess,
  hasStudentExperienceAccess,
  isActiveTrial,
} from "../src/lib/access-control.ts";

const now = new Date("2026-09-01T12:00:00.000Z");
const freeSong = { isPremium: false };
const premiumSong = { isPremium: true };

test("a student profile always keeps the free experience", () => {
  assert.equal(hasStudentExperienceAccess({ subscription_status: null }), true);
  assert.equal(hasStudentExperienceAccess({ subscription_status: "canceled" }), true);
  assert.equal(hasStudentExperienceAccess(undefined), false);
});

test("an active trial grants premium access until its exact end", () => {
  const activeTrial = {
    subscription_status: "trialing",
    trial_ends_at: "2026-09-02T12:00:00.000Z",
  };
  const expiredTrial = {
    subscription_status: "trialing",
    trial_ends_at: "2026-09-01T11:59:59.999Z",
  };

  assert.equal(isActiveTrial(activeTrial, now), true);
  assert.equal(hasPremiumAccess(activeTrial, now), true);
  assert.equal(isActiveTrial(expiredTrial, now), false);
  assert.equal(hasPremiumAccess(expiredTrial, now), false);
});

test("paid and administratively granted profiles receive premium access", () => {
  assert.equal(hasPremiumAccess({ subscription_status: "active" }, now), true);
  assert.equal(hasPremiumAccess({ subscription_status: "admin_granted" }, now), true);
  assert.equal(hasPremiumAccess({ subscription_status: "past_due" }, now), false);
  assert.equal(hasPremiumAccess({ subscription_status: "canceled" }, now), false);
});

test("song entitlement cannot be bypassed by choosing a direct premium URL", () => {
  const freeProfile = { subscription_status: "canceled" };
  const paidProfile = { subscription_status: "active" };

  assert.equal(canAccessSong(freeSong, freeProfile, { now }), true);
  assert.equal(canAccessSong(premiumSong, freeProfile, { now }), false);
  assert.equal(canAccessSong(premiumSong, paidProfile, { now }), true);
  assert.equal(canAccessSong(premiumSong, undefined, { now }), false);
  assert.equal(
    canAccessSong(premiumSong, undefined, { hasSpecialAccess: true, now }),
    true,
  );
});
