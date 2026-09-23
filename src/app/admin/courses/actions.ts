"use server";

import { revalidatePath } from "next/cache";
import { createCourse } from "@/lib/academic-structure/courses";
import { createAcademicTerm } from "@/lib/academic-structure/terms";

export async function createCourseAction(formData: FormData) {
  const programId = String(formData.get("programId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const creditHours = Number(formData.get("creditHours"));
  const curriculumSemester = Number(formData.get("curriculumSemester"));
  const isVerifiedCurriculum = formData.get("isVerifiedCurriculum") === "on";

  if (!programId || !code || !title || Number.isNaN(creditHours) || !Number.isInteger(curriculumSemester)) {
    throw new Error("All course fields are required");
  }

  await createCourse({ programId, code, title, creditHours, curriculumSemester, isVerifiedCurriculum });
  revalidatePath("/admin/courses");
}

export async function createAcademicTermAction(formData: FormData) {
  const season = String(formData.get("season") ?? "") as "fall" | "spring" | "summer";
  const year = Number(formData.get("year"));

  if (!["fall", "spring", "summer"].includes(season) || !Number.isInteger(year)) {
    throw new Error("A valid season and year are required");
  }

  await createAcademicTerm({ season, year });
  revalidatePath("/admin/courses");
}
