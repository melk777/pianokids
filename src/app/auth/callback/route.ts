import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getURL } from "@/lib/utils/url";

function getSafeRedirectPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/")) {
    return "/dashboard";
  }

  if (nextParam.startsWith("//") || /[\r\n]/.test(nextParam)) {
    return "/dashboard";
  }

  return nextParam;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${getURL()}${next}`);
    }
  }

  return NextResponse.redirect(`${getURL()}/auth/auth-code-error`);
}
