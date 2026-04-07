import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltando variáveis de ambiente do Supabase. Verifique o arquivo .env.local."
  );
}

// Cliente dinâmico: No navegador usa cookies (SSR), no servidor usa o cliente padrão
export const supabase = typeof window !== "undefined" 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey) 
  : createClient(supabaseUrl, supabaseAnonKey);

export const createClientComponent = () => createBrowserClient(supabaseUrl, supabaseAnonKey);
