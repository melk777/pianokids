import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const adminRoutes = [
  "src/app/api/admin/analytics/route.ts",
  "src/app/api/admin/expenses/route.ts",
  "src/app/api/admin/financial/route.ts",
  "src/app/api/admin/readiness/route.ts",
  "src/app/api/admin/stats/route.ts",
  "src/app/api/admin/teachers/route.ts",
  "src/app/api/admin/withdrawals/route.ts",
];

for (const route of adminRoutes) {
  test(`${route} authenticates and checks the admin role`, () => {
    const contents = source(route);
    assert.match(contents, /auth\.getUser|getOptionalSupabaseUser/);
    assert.match(contents, /role\s*!==\s*["']admin["']/);
  });
}

for (const route of [
  "src/app/api/teacher/stats/route.ts",
  "src/app/api/teacher/withdraw/route.ts",
]) {
  test(`${route} authenticates and checks the teacher role`, () => {
    const contents = source(route);
    assert.match(contents, /getOptionalSupabaseUser/);
    assert.match(contents, /role\s*!==\s*["']teacher["']/);
  });
}

test("dashboard UI keeps staff out of student-only audio and sales flows", () => {
  const dashboard = source("src/app/dashboard/page.tsx");
  const header = source("src/components/Header.tsx");

  assert.match(dashboard, /isStudentDashboardRole\(profile\?\.role\)/);
  assert.match(dashboard, /profile\?\.role === "admin"/);
  assert.match(dashboard, /profile\?\.role === "teacher"/);
  assert.match(header, /shouldShowPlanLink\(profile\?\.role, Boolean\(user\)\)/);
  assert.match(header, /getDashboardLabel\(profile\?\.role\)/);
});

test("financial form includes every expense category stored by the API", () => {
  const dashboard = source("src/components/AdminDashboard.tsx");

  for (const field of ["marketing", "development", "copyrights", "other"]) {
    assert.match(dashboard, new RegExp(`expensesData\\.${field}`));
  }
});

test("withdrawal migration reserves and settles commission entries transactionally", () => {
  const migration = source("supabase/migrations/20260901000000_launch_billing_hardening.sql");

  assert.match(migration, /create or replace function public\.request_teacher_withdrawal\(\)/i);
  assert.match(migration, /for update;/i);
  assert.match(migration, /set withdrawal_id = created_withdrawal\.id/i);
  assert.match(migration, /create or replace function public\.review_teacher_withdrawal\(/i);
  assert.match(migration, /set settled_at = now\(\)/i);
  assert.match(migration, /revoke insert on public\.withdrawals from authenticated/i);
});
