import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/identity/session-cookie-name";

// Coarse gate: redirects unauthenticated requests away from protected
// areas. Deliberately does NOT verify the session's HMAC signature or role
// here — the authoritative check, including signature verification and
// role matching, is requireRole() (src/lib/identity/require-role.ts),
// called by every protected page/layout itself. This keeps the same
// "cheap redirect here, real verification server-side" split Supabase's own
// middleware examples use, even though Next 16's `proxy` convention now
// runs on the Node.js runtime (so the node:crypto restriction that
// motivated the split under the old `middleware` convention no longer
// strictly applies) — requireRole() stays the single source of truth for
// auth either way.
const PROTECTED_PREFIXES = ["/admin", "/teacher", "/student"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtected && !request.cookies.get(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
