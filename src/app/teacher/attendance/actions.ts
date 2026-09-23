"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/identity/require-role";
import { correctAttendanceRecord } from "@/lib/attendance/teacher";
import type { AttendanceStatusEnum } from "@/db/schema/attendance";

const VALID_STATUSES: AttendanceStatusEnum[] = ["present", "absent", "leave"];

/**
 * Corrects a single, EXISTING record — there is deliberately no
 * "create session" action anywhere under /teacher (SPEC-attendance.md:
 * "teacher UI only ever renders an 'edit' affordance, never 'add'"). Even if
 * this were called with a crafted request for a session/record the teacher
 * isn't assigned to, correctAttendanceRecord goes through withUserDb, so RLS
 * denies it at the database level (attendance_records_teacher_update).
 */
export async function correctRecordAction(formData: FormData) {
  const session = await requireRole("teacher");
  const recordId = String(formData.get("recordId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  const raw = String(formData.get("status") ?? "");

  if (!recordId || !sessionId || !VALID_STATUSES.includes(raw as AttendanceStatusEnum)) {
    throw new Error("Invalid attendance correction request.");
  }

  await correctAttendanceRecord(session.userId, recordId, raw as AttendanceStatusEnum);
  revalidatePath(`/teacher/attendance/${sessionId}`);
}
