import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicTerms, classes, courseOfferings, courses } from "@/db/schema/academic-structure";

export async function createCourseOffering(input: {
  classId: string;
  courseId: string;
  termId: string;
  teacherId?: string | null;
}) {
  const [cls] = await db.select().from(classes).where(eq(classes.id, input.classId));
  if (!cls) {
    throw new Error(`Class ${input.classId} not found`);
  }

  const [offering] = await db
    .insert(courseOfferings)
    .values({
      classId: input.classId,
      courseId: input.courseId,
      termId: input.termId,
      teacherId: input.teacherId ?? null,
      // Denormalized snapshot of the class's semester at offering time.
      semesterNumber: cls.currentSemester,
    })
    .returning();
  return offering;
}

export async function listOfferingsForClass(classId: string) {
  return db.select().from(courseOfferings).where(eq(courseOfferings.classId, classId));
}

export async function listOfferingsForTerm(termId: string) {
  return db.select().from(courseOfferings).where(eq(courseOfferings.termId, termId));
}

/** All offerings with enough context (course code/title, term name) to render a readable admin list. */
export async function listAllOfferingsWithContext() {
  return db
    .select({
      id: courseOfferings.id,
      classId: courseOfferings.classId,
      courseCode: courses.code,
      courseTitle: courses.title,
      termName: academicTerms.name,
      teacherId: courseOfferings.teacherId,
      semesterNumber: courseOfferings.semesterNumber,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .innerJoin(academicTerms, eq(courseOfferings.termId, academicTerms.id))
    .orderBy(desc(academicTerms.year), courses.code);
}
