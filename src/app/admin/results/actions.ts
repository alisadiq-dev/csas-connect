"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/identity/require-role";
import { upsertResult } from "@/lib/results/admin";
import type { SpecialStatusEnum } from "@/db/schema/results";

const VALID_STATUSES: SpecialStatusEnum[] = ["W", "FW", "I"];

export type SaveResultsState = { error: string | null };

function parseMarks(formData: FormData, field: string): number | null {
  const raw = formData.get(field);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function saveResultsAction(
  _prevState: SaveResultsState,
  formData: FormData,
): Promise<SaveResultsState> {
  const session = await requireRole("admin");

  const courseOfferingId = String(formData.get("courseOfferingId") ?? "");
  const studentIds = formData.getAll("studentUserId").map(String);

  if (!courseOfferingId || studentIds.length === 0) {
    return { error: "Course offering and at least one student are required." };
  }

  try {
    for (const studentUserId of studentIds) {
      const rawStatus = String(formData.get(`specialStatus-${studentUserId}`) ?? "");
      const specialStatus = VALID_STATUSES.includes(rawStatus as SpecialStatusEnum) ? (rawStatus as SpecialStatusEnum) : null;

      await upsertResult({
        courseOfferingId,
        studentUserId,
        sessionalMarks: parseMarks(formData, `sessional-${studentUserId}`),
        midTermMarks: parseMarks(formData, `mid-${studentUserId}`),
        finalTermMarks: parseMarks(formData, `final-${studentUserId}`),
        specialStatus,
        updatedBy: session.userId,
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save results." };
  }

  revalidatePath("/admin/results");
  redirect(`/admin/results?courseOfferingId=${courseOfferingId}`);
}
