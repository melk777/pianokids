/**
 * Access control helpers shared across middleware and API routes.
 */

export const SPECIAL_ACCESS_IDS: string[] = [
  "alessia_samanta@hotmail.com",
  "comerciomelk@gmail.com",
  "melkhenrique1@icloud.com",
];

type AccessProfile = {
  subscription_status?: string | null;
  trial_ends_at?: string | null;
} | null | undefined;

export function hasSpecialAccess(userId: string | null | undefined, email?: string | null): boolean {
  const normalizedList = SPECIAL_ACCESS_IDS.map((id) => id.toLowerCase().trim());

  if (userId && normalizedList.includes(userId.toLowerCase().trim())) return true;
  if (email && normalizedList.includes(email.toLowerCase().trim())) return true;

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
