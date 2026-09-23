"use server";

import { revalidatePath } from "next/cache";
import { createStudent } from "@/lib/identity/students";

export type StudentFormState = { error: string | null; createdRollNumber?: string };

export async function createStudentAction(
  _prevState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const isClassRep = formData.get("isClassRep") === "on";

  if (!fullName || !email || !password || !classId) {
    return { error: "Name, email, password, and class are all required." };
  }

  try {
    const student = await createStudent({ fullName, email, password, classId, isClassRep });
    revalidatePath("/admin/students");
    return { error: null, createdRollNumber: student.rollNumber };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create student account." };
  }
}
