export type AnalyticsEventName =
  | "landing_view"
  | "landing_cta_clicked"
  | "pricing_view"
  | "checkout_started"
  | "checkout_redirected"
  | "auth_login_started"
  | "auth_login_completed"
  | "auth_signup_started"
  | "auth_signup_completed"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "library_view"
  | "library_filter_changed"
  | "library_search_used"
  | "first_lesson_started"
  | "song_card_opened"
  | "song_locked_clicked"
  | "song_started"
  | "tutorial_completed"
  | "song_finished"
  | "score_restart_clicked"
  | "recommended_practice_clicked";

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsPayload {
  event: AnalyticsEventName;
  properties?: AnalyticsProperties;
  path?: string;
  referrer?: string;
  anonymousId?: string;
}

const ANONYMOUS_ID_KEY = "pianify.anonymousId";

function getAnonymousId() {
  if (typeof window === "undefined") return undefined;

  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(ANONYMOUS_ID_KEY, generated);
  return generated;
}

export function trackEvent(event: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;

  const payload: AnalyticsPayload = {
    event,
    properties,
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    anonymousId: getAnonymousId(),
  };

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/analytics/event", new Blob([body], { type: "application/json" }));
      if (sent) return;
    }
  } catch {
    // Falls back to fetch below.
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never block the product experience.
  });
}
