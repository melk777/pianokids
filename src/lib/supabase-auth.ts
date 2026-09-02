export type SupabaseAuthErrorLike = {
  name?: string;
  message?: string;
} | null | undefined;

export function isMissingSupabaseSessionError(error: SupabaseAuthErrorLike) {
  if (!error) return false;
  if (error.name === "AuthSessionMissingError") return true;

  const message = error.message?.trim().toLowerCase();
  return message === "auth session missing" || message === "auth session missing!";
}
