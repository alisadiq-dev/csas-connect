import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminProfiles, studentProfiles, teacherProfiles } from "@/db/schema/identity";
import type { Role } from "./session";

/** Looks up which of the three profile tables a user belongs to. Admin-bypass (raw db) — used only at login/account-creation time, never per-request. */
export async function determineRole(userId: string): Promise<Role | null> {
  const [admin] = await db.select({ userId: adminProfiles.userId }).from(adminProfiles).where(eq(adminProfiles.userId, userId));
  if (admin) return "admin";

  const [teacher] = await db.select({ userId: teacherProfiles.userId }).from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
  if (teacher) return "teacher";

  const [student] = await db.select({ userId: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.userId, userId));
  if (student) return "student";

  return null;
}
