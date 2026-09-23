import { redirect } from "next/navigation";
import { getSession, type Role, type SessionPayload } from "./session";

/**
 * The single auth-check helper every server action/route handler calls
 * before touching data — no route reimplements its own auth check
 * (SPEC-identity.md boundary). Redirects to /login if there's no session,
 * or to the caller's own role root if they're logged in as the wrong role.
 */
export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== role) {
    redirect(`/${session.role}`);
  }
  return session;
}
