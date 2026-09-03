import assert from "node:assert/strict";
import test from "node:test";

import { readApiJson } from "../src/lib/client-api.ts";

test("readApiJson returns a successful JSON payload", async () => {
  const response = Response.json({ success: true, value: 42 });
  const payload = await readApiJson<{ success: boolean; value: number }>(response, "Falha");

  assert.deepEqual(payload, { success: true, value: 42 });
});

test("readApiJson surfaces the API error message", async () => {
  const response = Response.json({ error: "Acesso negado." }, { status: 403 });

  await assert.rejects(
    () => readApiJson(response, "Falha genérica"),
    /Acesso negado\./,
  );
});

test("readApiJson handles non-JSON failures without hiding the HTTP status", async () => {
  const response = new Response("Gateway indisponível", { status: 502 });

  await assert.rejects(
    () => readApiJson(response, "Não foi possível carregar"),
    /HTTP 502/,
  );
});
