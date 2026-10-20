import { sql } from "drizzle-orm";
import { db } from "@/db";

export type DemoAccount = { role: "student" | "teacher" | "admin"; label: string; email: string; password: string };

/**
 * Seeded demo logins (documented in README, created by `npm run db:seed:auth`). They are shown on the
 * landing and login pages for frictionless testing, but only outside production — a deployed site
 * must not advertise credentials — unless SHOW_DEMO_ACCOUNTS=true is set explicitly.
 */
export function demoAccountsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_ACCOUNTS === "true";
}

export async function listDemoAccounts(): Promise<DemoAccount[]> {
  if (!demoAccountsEnabled()) return [];

  const accounts: DemoAccount[] = [
    { role: "admin", label: "Administrator", email: "admin@csas-connect.local", password: "AdminPass123!" },
    { role: "teacher", label: "Teacher", email: "teacher.stat.1@csas-connect.local", password: "TeacherPass123!" },
  ];

  try {
    // Student emails embed a per-seed class id prefix, so look up the first seeded student.
    const rows = await db.execute<{ email: string }>(
      sql`select email from auth.users where email like 'student.%@csas-connect.local' order by email limit 1`,
    );
    if (rows[0]?.email) {
      accounts.unshift({ role: "student", label: "Student", email: rows[0].email, password: "StudentPass123!" });
    }
  } catch {
    // Database unavailable: just omit the student row.
  }
  return accounts;
}
