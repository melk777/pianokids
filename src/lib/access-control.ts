/**
 * Access control helpers shared across proxy and API routes.
 * Special access is deployment configuration, never a hardcoded entitlement.
 */

function getSpecialAccessIds(): Set<string> {
  return new Set(
    (process.env.SPECIAL_ACCESS_IDS ?? "")
      .split(",")
      .map((id) => id.toLowerCase().trim())
      .filter(Boolean),
  );
}

type AccessProfile = {
  subscription_status?: string | null;
  trial_ends_at?: string | null;
} | null | undefined;

export function hasSpecialAccess(userId: string | null | undefined, email?: string | null): boolean {
  const normalizedList = getSpecialAccessIds();

  if (userId && normalizedList.has(userId.toLowerCase().trim())) return true;
  if (email && normalizedList.has(email.toLowerCase().trim())) return true;

  return false;
}

export function hasStudentExperienceAccess(profile: AccessProfile, now: Date = new Date()): boolean {
  if (!profile) return false;

  if (
    profile.subscription_status === "active" ||
    profile.subscription_status === "admin_granted"
  ) {
    return true;
  }

  if (profile.subscription_status !== "trialing" || !profile.trial_ends_at) {
    return false;
  }

  const trialEndsAt = new Date(profile.trial_ends_at);
  return !Number.isNaN(trialEndsAt.getTime()) && now < trialEndsAt;
}
