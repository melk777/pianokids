import { NextRequest, NextResponse } from "next/server";
import { LOCAL_DEV_AUTH_COOKIE, isLocalDevAuthAllowed } from "@/lib/localDevAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const hostHeader = request.headers.get("host")?.replace(/:\d+$/, "");
  const isAllowed =
    isLocalDevAuthAllowed(request.nextUrl.hostname) ||
    isLocalDevAuthAllowed(hostHeader);

  if (!isAllowed) {
    return NextResponse.json({ error: "Not available outside local development." }, { status: 404 });
  }

  const redirectUrl = new URL("/dashboard/songs", request.url);
  const requestHost = request.headers.get("host");
  if (requestHost && isLocalDevAuthAllowed(hostHeader)) {
    redirectUrl.host = requestHost;
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    name: LOCAL_DEV_AUTH_COOKIE,
    value: "1",
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
  });

  return response;
}
