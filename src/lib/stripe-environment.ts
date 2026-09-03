export type StripeKeyMode = "live" | "test" | "unknown";

export interface StripeEnvironmentCheck {
  ok: boolean;
  mode: StripeKeyMode;
  reason: string;
}

export function getStripeKeyMode(key: string | undefined): StripeKeyMode {
  if (key?.startsWith("sk_live_")) return "live";
  if (key?.startsWith("sk_test_")) return "test";
  return "unknown";
}

export function evaluateStripeEnvironment({
  key,
  vercelEnvironment,
  nodeEnvironment,
}: {
  key: string | undefined;
  vercelEnvironment: string | undefined;
  nodeEnvironment: string | undefined;
}): StripeEnvironmentCheck {
  const mode = getStripeKeyMode(key);

  if (mode === "unknown") {
    return {
      ok: false,
      mode,
      reason: "A chave Stripe está ausente ou não possui um prefixo reconhecido.",
    };
  }

  if (vercelEnvironment === "production" && mode !== "live") {
    return {
      ok: false,
      mode,
      reason: "A produção da Vercel deve usar uma chave Stripe live.",
    };
  }

  if (vercelEnvironment && vercelEnvironment !== "production" && mode === "live") {
    return {
      ok: false,
      mode,
      reason: "Ambientes de Preview e Development não podem usar uma chave Stripe live.",
    };
  }

  if (!vercelEnvironment && nodeEnvironment !== "production" && mode === "live") {
    return {
      ok: false,
      mode,
      reason: "O desenvolvimento local não pode usar uma chave Stripe live.",
    };
  }

  return { ok: true, mode, reason: "Ambiente Stripe compatível com o deployment." };
}

export function assertSafeStripeEnvironment(key: string) {
  const check = evaluateStripeEnvironment({
    key,
    vercelEnvironment: process.env.VERCEL_ENV,
    nodeEnvironment: process.env.NODE_ENV,
  });

  if (!check.ok) throw new Error(check.reason);
}
