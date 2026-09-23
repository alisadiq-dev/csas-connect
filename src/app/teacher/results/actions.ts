"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/identity/require-role";
import { correctResult } from "@/lib/results/teacher";
import type { SpecialStatusEnum } from "@/db/schema/results";

const VALID_STATUSES: SpecialStatusEnum[] = ["W", "FW", "I"];

function parseMarks(formData: FormData, field: string): number | null {
  const raw = formData.get(field);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Corrects one EXISTING result — no "add result" control anywhere under /teacher (SPEC-results.md). */
export async function correctResultAction(formData: FormData) {
  const session = await requireRole("teacher");
  const resultId = String(formData.get("resultId") ?? "");
  const courseOfferingId = String(formData.get("courseOfferingId") ?? "");
  const rawStatus = String(formData.get("specialStatus") ?? "");
  const specialStatus = VALID_STATUSES.includes(rawStatus as SpecialStatusEnum) ? (rawStatus as SpecialStatusEnum) : null;

  if (!resultId) {
    throw new Error("Missing result id.");
  }

  await correctResult(session.userId, resultId, {
    sessionalMarks: parseMarks(formData, "sessionalMarks"),
    midTermMarks: parseMarks(formData, "midTermMarks"),
    finalTermMarks: parseMarks(formData, "finalTermMarks"),
    specialStatus,
  });

  revalidatePath(`/teacher/results/${courseOfferingId}`);
}
