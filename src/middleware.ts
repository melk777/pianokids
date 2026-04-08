import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // IMPORTANTE: getUser() é essencial para segurança e para renovar a sessão via cookies.
  const { data: { user } } = await supabase.auth.getUser();

  const isPublicRoute = 
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/api/stripe/webhook");

  // 1. Redirecionar deslogados de rotas privadas para /login
  if (!user && !isPublicRoute) {
    const url = new URL("/login", request.url);
    // IMPORTANTE: Passar os headers da 'response' para manter o estado dos cookies
    return NextResponse.redirect(url, {
      headers: response.headers,
    });
  }

  // 2. Lógica de Trial Expirado para logados
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at")
      .eq("id", user.id)
      .single();

    if (profile) {
      const now = new Date();
      const trialEndsAt = new Date(profile.trial_ends_at);
      
      // Checagem de segurança para data inválida
      if (!isNaN(trialEndsAt.getTime())) {
        const isTrialExpired = now > trialEndsAt;
        const isNotActive = profile.subscription_status !== "active";

        if (isTrialExpired && isNotActive) {
          const url = new URL("/", request.url);
          url.hash = "pricing";
          return NextResponse.redirect(url, {
            headers: response.headers,
          });
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|mp3|wav|ttf|woff|woff2)$).*)",
  ],
};
