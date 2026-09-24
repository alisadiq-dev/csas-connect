import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { teacherProfiles } from "@/db/schema/identity";
import { createAuthUser } from "./auth";

/**
 * Admin-only account creation: uses the raw `db` export (owner bypass) plus
 * createAuthUser's admin-API-equivalent path — never withUserDb, since
 * there's no logged-in user yet to scope this to.
 */
export async function createTeacher(input: { email: string; password: string; fullName: string }) {
  const { userId } = await createAuthUser({ email: input.email, password: input.password });
  const [profile] = await db.insert(teacherProfiles).values({ userId, fullName: input.fullName }).returning();
  return profile;
}

export async function listTeachers() {
  return db.select().from(teacherProfiles).orderBy(asc(teacherProfiles.fullName));
}

/** Looks up one teacher's own profile (own-lookup during an already-authenticated request). */
export async function getTeacherByUserId(userId: string) {
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
  return profile ?? null;
}
