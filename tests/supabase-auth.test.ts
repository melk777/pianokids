import assert from "node:assert/strict";
import test from "node:test";
import { isMissingSupabaseSessionError } from "../src/lib/supabase-auth.ts";

test("recognizes Supabase's missing-session auth error", () => {
  assert.equal(
    isMissingSupabaseSessionError({
      name: "AuthSessionMissingError",
      message: "Auth session missing!",
    }),
    true,
  );
  assert.equal(isMissingSupabaseSessionError({ message: "Auth session missing!" }), true);
});

test("does not hide unrelated authentication failures", () => {
  assert.equal(isMissingSupabaseSessionError(null), false);
  assert.equal(
    isMissingSupabaseSessionError({
      name: "AuthApiError",
      message: "Invalid Refresh Token",
    }),
    false,
  );
});
