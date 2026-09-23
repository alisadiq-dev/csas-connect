import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema/identity";
import { createAuthUser } from "./auth";
import { generateRollNumber } from "./roll-number";

/** Same admin-only bypass rationale as createTeacher (see teachers.ts). */
export async function createStudent(input: {
  email: string;
  password: string;
  fullName: string;
  classId: string;
  isClassRep?: boolean;
}) {
  // Generated once, here, then immutable — the roll number, not a display
  // label (SPEC-identity.md).
  const rollNumber = await generateRollNumber(input.classId);
  const { userId } = await createAuthUser({ email: input.email, password: input.password });
  const [profile] = await db
    .insert(studentProfiles)
    .values({
      userId,
      fullName: input.fullName,
      rollNumber,
      classId: input.classId,
      isClassRep: input.isClassRep ?? false,
    })
    .returning();
  return profile;
}

export async function listAllStudents() {
  return db.select().from(studentProfiles).orderBy(asc(studentProfiles.rollNumber));
}

export async function listStudentsForClass(classId: string) {
  return db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.classId, classId))
    .orderBy(asc(studentProfiles.rollNumber));
}

export async function setClassRep(userId: string, isClassRep: boolean) {
  const [updated] = await db
    .update(studentProfiles)
    .set({ isClassRep })
    .where(eq(studentProfiles.userId, userId))
    .returning();
  return updated;
}
