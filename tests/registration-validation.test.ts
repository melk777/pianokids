import assert from "node:assert/strict";
import test from "node:test";
import {
  getAgeFromBirthDate,
  isValidBrazilianPhone,
  isValidCpf,
} from "../src/lib/registration-validation.ts";

test("calculates age without timezone drift", () => {
  assert.equal(getAgeFromBirthDate("2008-09-02", new Date("2026-09-01T12:00:00Z")), 17);
  assert.equal(getAgeFromBirthDate("2008-09-01", new Date("2026-09-01T12:00:00Z")), 18);
  assert.equal(getAgeFromBirthDate("2026-02-31", new Date("2026-09-01T12:00:00Z")), null);
});

test("validates CPF check digits", () => {
  assert.equal(isValidCpf("529.982.247-25"), true);
  assert.equal(isValidCpf("111.111.111-11"), false);
  assert.equal(isValidCpf("529.982.247-24"), false);
});

test("accepts Brazilian phone lengths after formatting is removed", () => {
  assert.equal(isValidBrazilianPhone("(11) 99999-9999"), true);
  assert.equal(isValidBrazilianPhone("123"), false);
});

