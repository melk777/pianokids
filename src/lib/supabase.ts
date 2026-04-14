import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FALLBACK_SUPABASE_URL = "http://127.0.0.1:54321";
const FALLBACK_SUPABASE_ANON_KEY = "public-anon-key";

function getSupabaseEnv({ allowFallbackOnServer = false }: { allowFallbackOnServer?: boolean } = {}) {
  if (supabaseUrl && supabaseAnonKey) {
    return {
      supabaseUrl,
      supabaseAnonKey,
    };
  }

  if (allowFallbackOnServer && typeof window === "undefined") {
    return {
      supabaseUrl: FALLBACK_SUPABASE_URL,
      supabaseAnonKey: FALLBACK_SUPABASE_ANON_KEY,
    };
  }

  throw new Error(
    "Supabase environment variables are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

let browserClient: SupabaseClient | null = null;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? (typeof window !== "undefined"
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : createClient(supabaseUrl, supabaseAnonKey))
    : null;

export const createClientComponent = () => {
  if (browserClient) {
    return browserClient;
  }

  const env = getSupabaseEnv({ allowFallbackOnServer: true });
  browserClient = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  return browserClient;
};
