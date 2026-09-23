import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Local stand-in for Supabase Storage — see SPEC-notices-events.md
// Boundaries for the full rationale. No cloud Supabase project is connected
// yet, so there's no Storage bucket to upload to locally; a PDF is instead
// written under public/uploads/notices/ and served as a static Next.js
// asset. `notice_attachments.file_url` stores this path exactly like it
// would store a Storage URL — swapping in real Storage later only touches
// this one file, never the schema, RLS, or calling code.
//
// Known limitation: Vercel's serverless filesystem is not writable after
// build, so this only works for local dev — a real Storage integration is
// required before production deployment (Task 45) can serve uploads.

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "notices");

export async function saveAttachmentFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return { fileUrl: `/uploads/notices/${storedName}`, fileName: file.name };
}
