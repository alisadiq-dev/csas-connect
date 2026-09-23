"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/identity/require-role";
import { addAttachment, createNotice, deleteNotice } from "@/lib/notices/admin";
import { saveAttachmentFile } from "@/lib/notices/attachments";
import type { AudienceScopeEnum } from "@/db/schema/notices-events";

const VALID_SCOPES: AudienceScopeEnum[] = ["department", "program", "class"];

export type CreateNoticeState = { error: string | null };

function optionalString(formData: FormData, field: string): string | null {
  const raw = String(formData.get(field) ?? "").trim();
  return raw || null;
}

function optionalDate(formData: FormData, field: string): Date | null {
  const raw = String(formData.get(field) ?? "").trim();
  return raw ? new Date(raw) : null;
}

export async function createNoticeAction(_prevState: CreateNoticeState, formData: FormData): Promise<CreateNoticeState> {
  const session = await requireRole("admin");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const audienceScope = String(formData.get("audienceScope") ?? "");
  const programId = optionalString(formData, "programId");
  const classId = optionalString(formData, "classId");

  if (!title || !category || !VALID_SCOPES.includes(audienceScope as AudienceScopeEnum)) {
    return { error: "Title, category, and audience scope are required." };
  }
  if (audienceScope === "program" && !programId) {
    return { error: "A program-scoped notice needs a program selected." };
  }
  if (audienceScope === "class" && !classId) {
    return { error: "A class-scoped notice needs a class selected." };
  }

  try {
    const notice = await createNotice({
      title,
      body: optionalString(formData, "body"),
      category,
      audienceScope: audienceScope as AudienceScopeEnum,
      programId: audienceScope !== "department" ? programId : null,
      classId: audienceScope === "class" ? classId : null,
      semesterLabel: optionalString(formData, "semesterLabel"),
      eventStartAt: optionalDate(formData, "eventStartAt"),
      eventEndAt: optionalDate(formData, "eventEndAt"),
      location: optionalString(formData, "location"),
      createdBy: session.userId,
    });

    const file = formData.get("attachment");
    if (file instanceof File && file.size > 0) {
      const { fileUrl, fileName } = await saveAttachmentFile(file);
      await addAttachment(notice.id, fileUrl, fileName);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create notice." };
  }

  revalidatePath("/admin/notices");
  return { error: null };
}

export async function deleteNoticeAction(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing notice id.");
  await deleteNotice(id);
  revalidatePath("/admin/notices");
}
