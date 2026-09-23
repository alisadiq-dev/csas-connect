"use server";

import { revalidatePath } from "next/cache";
import { createBatch } from "@/lib/academic-structure/batches";

export async function createBatchAction(formData: FormData) {
  const programId = String(formData.get("programId") ?? "");
  const intakeYear = Number(formData.get("intakeYear"));
  const currentSemester = Number(formData.get("currentSemester") ?? 1);

  if (!programId || !Number.isInteger(intakeYear)) {
    throw new Error("Program and a valid intake year are required");
  }

  await createBatch({ programId, intakeYear, currentSemester });
  revalidatePath("/admin/batches");
}
