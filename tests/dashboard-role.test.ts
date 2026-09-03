import assert from "node:assert/strict";
import test from "node:test";

import {
  getDashboardDescription,
  getDashboardLabel,
  isStudentDashboardRole,
  shouldShowPlanLink,
} from "../src/lib/dashboard-role.ts";

test("each account role receives the correct dashboard identity", () => {
  assert.equal(getDashboardLabel("student"), "Painel do Aluno");
  assert.equal(getDashboardLabel("teacher"), "Painel do Parceiro");
  assert.equal(getDashboardLabel("admin"), "Painel Administrativo");
});

test("only students can activate the learning experience", () => {
  assert.equal(isStudentDashboardRole("student"), true);
  assert.equal(isStudentDashboardRole("teacher"), false);
  assert.equal(isStudentDashboardRole("admin"), false);
  assert.equal(isStudentDashboardRole(undefined), false);
});

test("plan sales remain visible to visitors and students only", () => {
  assert.equal(shouldShowPlanLink(undefined, false), true);
  assert.equal(shouldShowPlanLink("student", true), true);
  assert.equal(shouldShowPlanLink("teacher", true), false);
  assert.equal(shouldShowPlanLink("admin", true), false);
});

test("dashboard descriptions do not present staff as students", () => {
  assert.match(getDashboardDescription("admin", false), /operação/i);
  assert.match(getDashboardDescription("teacher", false), /comissões/i);
  assert.match(getDashboardDescription("student", true), /praticando/i);
});
