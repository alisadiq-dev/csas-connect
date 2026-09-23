import { redirect } from "next/navigation";
import { getStudentByUserId } from "./students";
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

/** For routes any authenticated role can reach (e.g. the shared /notices feed) — still redirects to /login if there's no session, just doesn't restrict by role. */
export async function requireAnySession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export type CrSessionPayload = SessionPayload & { classId: string };

/**
 * CR is not a fourth entry in `Role` — it's a permission level inside the
 * `student` role, modeled as `student_profiles.is_class_rep`
 * (SPEC-identity.md / CAPABILITY_MAP.md: "CR is a permission level inside
 * `identity`, scoped to `notices-events` (own class) and read-only
 * `timetable`"). The `/cr` area therefore gates on requireRole('student')
 * first, then this additional check — never a standalone role check, so a
 * plain student hitting `/cr/*` gets redirected the same way a
 * wrong-role request would anywhere else in the app.
 */
export async function requireClassRep(): Promise<CrSessionPayload> {
  const session = await requireRole("student");
  const profile = await getStudentByUserId(session.userId);
  if (!profile?.isClassRep) {
    redirect("/student");
  }
  return { ...session, classId: profile.classId };
}
