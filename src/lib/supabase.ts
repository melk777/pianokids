import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase environment variables are missing. Check your Project Settings."
  );
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? (typeof window !== "undefined" 
    ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) 
    : createClient(supabaseUrl!, supabaseAnonKey!))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : ({} as any);

export const createClientComponent = () => createBrowserClient(supabaseUrl || "", supabaseAnonKey || "");
