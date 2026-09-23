"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/identity/require-role";
import { createTimetableSlot, deleteTimetableSlot } from "@/lib/timetable/admin";
import type { DayOfWeekEnum } from "@/db/schema/timetable";

const VALID_DAYS: DayOfWeekEnum[] = ["mon", "tue", "wed", "thu", "fri", "sat"];

export type CreateSlotState = { error: string | null };

export async function createSlotAction(_prevState: CreateSlotState, formData: FormData): Promise<CreateSlotState> {
  await requireRole("admin");

  const courseOfferingId = String(formData.get("courseOfferingId") ?? "");
  const dayOfWeek = String(formData.get("dayOfWeek") ?? "");
  const periodNumber = Number(formData.get("periodNumber") ?? "");
  const room = String(formData.get("room") ?? "").trim();

  if (!courseOfferingId || !VALID_DAYS.includes(dayOfWeek as DayOfWeekEnum) || !periodNumber) {
    return { error: "Course offering, day, and period are all required." };
  }

  try {
    await createTimetableSlot({
      courseOfferingId,
      dayOfWeek: dayOfWeek as DayOfWeekEnum,
      periodNumber,
      room: room || null,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create timetable slot." };
  }

  revalidatePath("/admin/timetable");
  return { error: null };
}

export async function deleteSlotAction(formData: FormData) {
  await requireRole("admin");
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) throw new Error("Missing slot id.");
  await deleteTimetableSlot(slotId);
  revalidatePath("/admin/timetable");
}
