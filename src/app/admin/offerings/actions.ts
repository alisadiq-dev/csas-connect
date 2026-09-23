"use server";

import { revalidatePath } from "next/cache";
import { createCourseOffering } from "@/lib/academic-structure/offerings";

export async function createCourseOfferingAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const termId = String(formData.get("termId") ?? "");

  if (!classId || !courseId || !termId) {
    throw new Error("Class, course, and term are all required");
  }

  await createCourseOffering({ classId, courseId, termId });
  revalidatePath("/admin/offerings");
}
