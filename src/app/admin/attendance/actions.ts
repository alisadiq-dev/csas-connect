"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/identity/require-role";
import { createAttendanceSession } from "@/lib/attendance/admin";
import type { AttendanceStatusEnum } from "@/db/schema/attendance";

const VALID_STATUSES: AttendanceStatusEnum[] = ["present", "absent", "leave"];

export type CreateSessionState = { error: string | null };

export async function createSessionAction(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  const session = await requireRole("admin");

  const courseOfferingId = String(formData.get("courseOfferingId") ?? "");
  const sessionDate = String(formData.get("sessionDate") ?? "");
  const studentIds = formData.getAll("studentUserId").map(String);

  if (!courseOfferingId || !sessionDate || studentIds.length === 0) {
    return { error: "Course offering, date, and at least one student are required." };
  }

  const statuses = studentIds.map((studentUserId) => {
    const raw = String(formData.get(`status-${studentUserId}`) ?? "present");
    const status = VALID_STATUSES.includes(raw as AttendanceStatusEnum) ? (raw as AttendanceStatusEnum) : "present";
    return { studentUserId, status };
  });

  try {
    await createAttendanceSession({ courseOfferingId, sessionDate, createdBy: session.userId, statuses });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create attendance session." };
  }

  revalidatePath("/admin/attendance");
  redirect(`/admin/attendance?courseOfferingId=${courseOfferingId}`);
}
