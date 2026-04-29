import { NextRequest, NextResponse } from "next/server";
import { LOCAL_DEV_AUTH_COOKIE, isLocalDevAuthAllowed } from "@/lib/localDevAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isLocalDevAuthAllowed(request.nextUrl.hostname)) {
    return NextResponse.json({ error: "Not available outside local development." }, { status: 404 });
  }

  const response = NextResponse.redirect(new URL("/dashboard/songs", request.url));
  response.cookies.set({
    name: LOCAL_DEV_AUTH_COOKIE,
    value: "1",
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
  });

  return response;
}
