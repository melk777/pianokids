import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isStudentExperienceRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard/songs") ||
    pathname.startsWith("/dashboard/play") ||
    pathname.startsWith("/dashboard/practice") ||
    pathname.startsWith("/dashboard/test-audio")
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/professores") ||
    pathname.startsWith("/privacidade") ||
    pathname.startsWith("/api/auth/turnstile-key") ||
    pathname.startsWith("/api/stripe/checkout") ||
    pathname.startsWith("/api/stripe/webhook");

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url), {
      headers: response.headers,
    });
  }

  if (user && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      headers: response.headers,
    });
  }

  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? user.user_metadata?.role ?? "student";

    if ((role === "teacher" || role === "admin") && isStudentExperienceRoute(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url), {
        headers: response.headers,
      });
    }

    if (role === "student" && profile) {
      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;

      if (trialEndsAt && !Number.isNaN(trialEndsAt.getTime())) {
        const isTrialExpired = new Date() > trialEndsAt;
        const isNotActive =
          profile.subscription_status !== "active" &&
          profile.subscription_status !== "admin_granted";

        if (isTrialExpired && isNotActive && isStudentExperienceRoute(pathname)) {
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
