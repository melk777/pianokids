import assert from "node:assert/strict";
import test from "node:test";
import {
  deletionModeFor,
  isDeletionConfirmed,
  isOwnAvatarFile,
  isSameOriginRequest,
  subscriptionNeedsCancel,
} from "../src/lib/accountDeletion.ts";

test("students delete now, teachers request, admins are blocked", () => {
  assert.equal(deletionModeFor("student"), "delete");
  assert.equal(deletionModeFor(null), "delete");
  assert.equal(deletionModeFor(undefined), "delete");
  assert.equal(deletionModeFor("teacher"), "request");
  assert.equal(deletionModeFor("admin"), "blocked");
});

test("confirmation must be the word EXCLUIR", () => {
  assert.equal(isDeletionConfirmed("EXCLUIR"), true);
  assert.equal(isDeletionConfirmed("  excluir "), true);
  assert.equal(isDeletionConfirmed("sim"), false);
  assert.equal(isDeletionConfirmed(""), false);
  assert.equal(isDeletionConfirmed(undefined), false);
  assert.equal(isDeletionConfirmed(1), false);
});

test("only subscriptions that can still charge are cancelled", () => {
  for (const status of ["active", "trialing", "past_due", "unpaid", "incomplete"]) {
    assert.equal(subscriptionNeedsCancel(status), true, status);
  }
  for (const status of ["canceled", "incomplete_expired", "paused"]) {
    assert.equal(subscriptionNeedsCancel(status), false, status);
  }
});

test("deletion requests must come from the site itself", () => {
  assert.equal(isSameOriginRequest("https://www.pianify.com.br", "www.pianify.com.br"), true);
  assert.equal(isSameOriginRequest("http://localhost:3000", "localhost:3000"), true);
  assert.equal(isSameOriginRequest("https://evil.example", "www.pianify.com.br"), false);
  assert.equal(isSameOriginRequest(null, "www.pianify.com.br"), false);
  assert.equal(isSameOriginRequest("not a url", "www.pianify.com.br"), false);
});

test("only the user's own avatar files are removed", () => {
  const id = "3f1c2a9e-0000-4000-8000-000000000001";
  assert.equal(isOwnAvatarFile(`${id}-1712345678.png`, id), true);
  assert.equal(isOwnAvatarFile("3f1c2a9e-0000-4000-8000-000000000002-1.png", id), false);
  assert.equal(isOwnAvatarFile(`x${id}-1.png`, id), false);
});
