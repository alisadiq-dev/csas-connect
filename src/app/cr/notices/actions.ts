"use server";

import { revalidatePath } from "next/cache";
import { requireClassRep } from "@/lib/identity/require-role";
import { addAttachmentAsCr, createOwnClassNotice, deleteOwnClassNotice } from "@/lib/notices/cr";
import { saveAttachmentFile } from "@/lib/notices/attachments";

export type CreateCrNoticeState = { error: string | null };

function optionalString(formData: FormData, field: string): string | null {
  const raw = String(formData.get(field) ?? "").trim();
  return raw || null;
}

function optionalDate(formData: FormData, field: string): Date | null {
  const raw = String(formData.get(field) ?? "").trim();
  return raw ? new Date(raw) : null;
}

/**
 * Always scoped to the CR's own class — classId never comes from the form,
 * only from requireClassRep()'s session lookup, so there is no client input
 * that could even attempt another class or scope. RLS (notices_events_cr_*)
 * is the real enforcement either way (SPEC-notices-events.md: "even via
 * direct API call").
 */
export async function createCrNoticeAction(_prevState: CreateCrNoticeState, formData: FormData): Promise<CreateCrNoticeState> {
  const session = await requireClassRep();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!title || !category) {
    return { error: "Title and category are required." };
  }

  try {
    const notice = await createOwnClassNotice(session.userId, {
      classId: session.classId,
      title,
      category,
      body: optionalString(formData, "body"),
      eventStartAt: optionalDate(formData, "eventStartAt"),
      eventEndAt: optionalDate(formData, "eventEndAt"),
      location: optionalString(formData, "location"),
    });

    const file = formData.get("attachment");
    if (file instanceof File && file.size > 0 && notice) {
      const { fileUrl, fileName } = await saveAttachmentFile(file);
      await addAttachmentAsCr(session.userId, notice.id, fileUrl, fileName);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post notice." };
  }

  revalidatePath("/cr/notices");
  return { error: null };
}

export async function deleteCrNoticeAction(formData: FormData) {
  const session = await requireClassRep();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing notice id.");
  await deleteOwnClassNotice(session.userId, id);
  revalidatePath("/cr/notices");
}
