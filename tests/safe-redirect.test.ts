import assert from "node:assert/strict";
import test from "node:test";
import { getSafeInternalRedirect } from "../src/lib/safe-redirect.ts";

test("accepts an internal path with query parameters", () => {
  assert.equal(
    getSafeInternalRedirect("/dashboard/subscription?plan=yearly"),
    "/dashboard/subscription?plan=yearly",
  );
});

test("rejects absolute, protocol-relative and malformed redirects", () => {
  for (const redirect of [
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/dashboard\r\nLocation: https://example.com",
  ]) {
    assert.equal(getSafeInternalRedirect(redirect), "/dashboard");
  }
});

test("uses a caller-provided fallback", () => {
  assert.equal(getSafeInternalRedirect(null, "/dashboard/songs"), "/dashboard/songs");
});

