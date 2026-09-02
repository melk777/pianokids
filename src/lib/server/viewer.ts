import "server-only";

import { cookies, headers } from "next/headers";
import { hasSpecialAccess, type AccessProfile } from "@/lib/access-control";
import {
  getLocalDevProfile,
  isLocalDevAuthAllowed,
  LOCAL_DEV_AUTH_COOKIE,
} from "@/lib/localDevAuth";
import { createServerSupabaseReadClient, getOptionalSupabaseUser } from "@/lib/server/supabase";

export type ServerViewer = {
  userId: string;
  email: string | null;
  role: string;
  profile: Exclude<AccessProfile, null | undefined>;
  specialAccess: boolean;
  isLocalDevelopment: boolean;
};

function normalizeHostname(host: string | null) {
  if (!host) return null;
  const withoutPort = host.startsWith("[")
    ? host.slice(1, host.indexOf("]"))
    : host.split(":")[0];
  return withoutPort.toLowerCase();
}

export async function getServerViewer(): Promise<ServerViewer | null> {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const hostname = normalizeHostname(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  if (
    isLocalDevAuthAllowed(hostname) &&
    cookieStore.get(LOCAL_DEV_AUTH_COOKIE)?.value === "1"
  ) {
    const profile = getLocalDevProfile();
    return {
      userId: profile.id,
      email: "aluno-teste@localhost",
      role: "student",
      profile,
      specialAccess: true,
      isLocalDevelopment: true,
    };
  }

  if (
    isLocalDevAuthAllowed(hostname) &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    return null;
  }

  const supabase = await createServerSupabaseReadClient();
  const user = await getOptionalSupabaseUser(supabase);
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, subscription_status, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not load the authenticated profile: ${profileError.message}`);
  }

  if (!profile) {
    throw new Error("Authenticated user does not have a Pianify profile.");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: profile.role ?? user.user_metadata?.role ?? "student",
    profile,
    specialAccess: hasSpecialAccess(user.id, user.email),
    isLocalDevelopment: false,
  };
}
