import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasAuthCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  return cookies.some((c) => {
    const n = c.name.toLowerCase();
    return (
      n.startsWith("sb-") ||
      n.includes("supabase") ||
      n.includes("auth-token") ||
      n === "sb-access-token" ||
      n === "sb-refresh-token"
    );
  });
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  if (hasAuthCookie(request)) return NextResponse.next();

  const referer = request.headers.get("referer") ?? "";
  if (referer.includes("getprimeos.com")) return NextResponse.next();

  if (request.headers.get("x-nextjs-data")) return NextResponse.next();

  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchDest = request.headers.get("sec-fetch-dest");
  if (secFetchMode === "cors" || secFetchDest === "empty") return NextResponse.next();

  return NextResponse.redirect(new URL("/welcome", request.url));
}

export const config = {
  matcher: ["/"],
};
