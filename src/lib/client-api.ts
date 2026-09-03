type ErrorPayload = {
  error?: unknown;
};

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const error = (payload as ErrorPayload).error;
  return typeof error === "string" && error.trim() ? error.trim() : null;
}

export async function readApiJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    const suffix = response.status ? ` (HTTP ${response.status})` : "";
    throw new Error(`${fallbackMessage}${suffix}.`);
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) || fallbackMessage);
  }

  return payload as T;
}
