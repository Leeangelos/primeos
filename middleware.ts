import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Only run for exact root path
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const hasSupabaseAuth = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!hasSupabaseAuth) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
