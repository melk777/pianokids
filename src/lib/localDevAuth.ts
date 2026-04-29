import type { Profile } from "@/lib/types";

export const LOCAL_DEV_AUTH_COOKIE = "pianify_local_test";
export const LOCAL_DEV_AUTH_STORAGE_KEY = "pianify.localTestAuth";

export function isLocalDevHost(hostname: string | null | undefined) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isLocalDevAuthAllowed(hostname: string | null | undefined) {
  return process.env.NODE_ENV !== "production" && isLocalDevHost(hostname);
}

export function isLocalDevAuthEnabled() {
  if (typeof window === "undefined") return false;
  const hasLocalCookie = document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${LOCAL_DEV_AUTH_COOKIE}=1`));

  return (
    isLocalDevAuthAllowed(window.location.hostname) &&
    (window.localStorage.getItem(LOCAL_DEV_AUTH_STORAGE_KEY) === "1" || hasLocalCookie)
  );
}

export function getLocalDevProfile(): Profile {
  return {
    id: "local-dev-student",
    username: "aluno_teste_local",
    username_changes_count: 0,
    full_name: "Aluno Teste Local",
    avatar_url: null,
    trophies: 12,
    streak_days: 3,
    total_practice_time: 60 * 45,
    average_accuracy: 82,
    songs_played: 8,
    songs_completed: 5,
    last_practice_date: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
    role: "student",
    subscription_status: "admin_granted",
    subscription_plan_interval: "local",
    balance_withdrawn_total: 0,
  };
}
