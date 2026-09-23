import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema/academic-structure";

export async function createCourse(input: {
  programId: string;
  code: string;
  title: string;
  creditHours: number;
  curriculumSemester: number;
  isVerifiedCurriculum?: boolean;
}) {
  const [course] = await db
    .insert(courses)
    .values({
      programId: input.programId,
      code: input.code,
      title: input.title,
      creditHours: input.creditHours.toFixed(1),
      curriculumSemester: input.curriculumSemester,
      isVerifiedCurriculum: input.isVerifiedCurriculum ?? false,
    })
    .returning();
  return course;
}

export async function listCoursesForProgram(programId: string) {
  return db.select().from(courses).where(eq(courses.programId, programId)).orderBy(asc(courses.code));
}

export async function listAllCourses() {
  return db.select().from(courses).orderBy(asc(courses.programId), asc(courses.code));
}
