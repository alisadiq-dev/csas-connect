"use server";

import { revalidatePath } from "next/cache";
import { createProgram } from "@/lib/academic-structure/programs";

export async function createProgramAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!name || !code) {
    throw new Error("Name and code are required");
  }

  await createProgram({ name, code });
  revalidatePath("/admin/programs");
}
