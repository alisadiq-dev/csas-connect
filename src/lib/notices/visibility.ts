// See SPEC-notices-events.md. Shared by the read view AND the RLS test
// suite (tests/notices-events/rls.test.ts cross-checks the database policy
// against this same rule) — a single source of truth for the visibility
// rule so the app layer and the database policy can't silently drift apart.

export type AudienceScope = "department" | "program" | "class";

export type NoticeEvent = {
  audienceScope: AudienceScope;
  programId: string | null;
  classId: string | null;
};

export type Viewer = {
  programIds: string[];
  classIds: string[];
};

export function visibleTo(notice: NoticeEvent, viewer: Viewer): boolean {
  if (notice.audienceScope === "department") return true;
  if (notice.audienceScope === "program") return notice.programId !== null && viewer.programIds.includes(notice.programId);
  return notice.classId !== null && viewer.classIds.includes(notice.classId); // 'class'
}
