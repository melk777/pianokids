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

export type AccessProfile = {
  subscription_status?: string | null;
  trial_ends_at?: string | null;
} | null | undefined;

export type SongAccess = {
  isPremium: boolean;
};

export function hasSpecialAccess(userId: string | null | undefined, email?: string | null): boolean {
  const normalizedList = getSpecialAccessIds();

  if (userId && normalizedList.has(userId.toLowerCase().trim())) return true;
  if (email && normalizedList.has(email.toLowerCase().trim())) return true;

  return false;
}

export function isActiveTrial(profile: AccessProfile, now: Date = new Date()): boolean {
  if (profile?.subscription_status !== "trialing" || !profile.trial_ends_at) {
    return false;
  }

  const trialEndsAt = new Date(profile.trial_ends_at);
  return !Number.isNaN(trialEndsAt.getTime()) && now < trialEndsAt;
}

/**
 * Every authenticated student with a profile keeps access to the free catalog.
 * Premium access is evaluated separately so an expired trial never blocks the
 * free learning experience.
 */
export function hasStudentExperienceAccess(profile: AccessProfile): boolean {
  return Boolean(profile);
}

export function hasPremiumAccess(profile: AccessProfile, now: Date = new Date()): boolean {
  if (!profile) return false;

  if (
    profile.subscription_status === "active" ||
    profile.subscription_status === "admin_granted"
  ) {
    return true;
  }

  return isActiveTrial(profile, now);
}

export function canAccessSong(
  song: SongAccess,
  profile: AccessProfile,
  options: { hasSpecialAccess?: boolean; now?: Date } = {},
): boolean {
  if (options.hasSpecialAccess) return true;
  if (!hasStudentExperienceAccess(profile)) return false;
  if (!song.isPremium) return true;

  return hasPremiumAccess(profile, options.now);
}
