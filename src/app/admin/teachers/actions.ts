"use server";

import { revalidatePath } from "next/cache";
import { createTeacher } from "@/lib/identity/teachers";

export type TeacherFormState = { error: string | null };

export async function createTeacherAction(
  _prevState: TeacherFormState,
  formData: FormData,
): Promise<TeacherFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Name, email, and password are all required." };
  }

  try {
    await createTeacher({ fullName, email, password });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create teacher account." };
  }

  revalidatePath("/admin/teachers");
  return { error: null };
}
