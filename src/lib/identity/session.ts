import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME as COOKIE_NAME } from "./session-cookie-name";

/**
 * Local-dev-only session mechanism. NOT part of the "zero changes once a
 * real Supabase project is connected" promise — that promise is scoped to
 * the database access layer (src/lib/db/with-user.ts), which is what
 * actually enforces RLS. A real Supabase deployment authenticates through
 * Supabase Auth's own session/cookie flow (via @supabase/ssr or similar),
 * not this file; this file exists only because no real Supabase project
 * (with a running GoTrue server) is connected yet, so there's nothing for a
 * "real" login flow to authenticate against locally. `requireRole()` is the
 * single call site every route relies on, so swapping the underlying
 * session mechanism later touches this file only.
 */

export type Role = "admin" | "teacher" | "student";

const ONE_DAY_SECONDS = 60 * 60 * 24;

export type SessionPayload = { userId: string; role: Role };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — is .env.local loaded?");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

/** Exported for unit testing the signing round-trip without a request-scoped `cookies()` context. */
export function encodeSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json, "utf8").toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

/** Exported for unit testing (see encodeSessionToken). */
export function decodeSessionToken(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as SessionPayload;
    if (typeof parsed.userId !== "string" || !["admin", "teacher", "student"].includes(parsed.role)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: Role): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSessionToken({ userId, role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_DAY_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSessionToken(token);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export { SESSION_COOKIE_NAME } from "./session-cookie-name";
