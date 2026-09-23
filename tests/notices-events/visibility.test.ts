import { describe, expect, it } from "vitest";
import { visibleTo, type NoticeEvent, type Viewer } from "@/lib/notices/visibility";

const student: Viewer = { programIds: ["prog-stat"], classIds: ["class-stat-1"] };
const teacher: Viewer = { programIds: ["prog-stat", "prog-cs"], classIds: ["class-stat-1", "class-cs-3"] };
const cr: Viewer = { programIds: ["prog-stat"], classIds: ["class-stat-1"] };
const outsider: Viewer = { programIds: ["prog-biostat"], classIds: ["class-biostat-2"] };

describe("visibleTo (Task 38)", () => {
  const departmentNotice: NoticeEvent = { audienceScope: "department", programId: null, classId: null };
  const programNotice: NoticeEvent = { audienceScope: "program", programId: "prog-stat", classId: null };
  const classNotice: NoticeEvent = { audienceScope: "class", programId: null, classId: "class-stat-1" };

  it("department scope is visible to every viewer", () => {
    expect(visibleTo(departmentNotice, student)).toBe(true);
    expect(visibleTo(departmentNotice, teacher)).toBe(true);
    expect(visibleTo(departmentNotice, cr)).toBe(true);
    expect(visibleTo(departmentNotice, outsider)).toBe(true);
  });

  it("program scope is visible only to viewers whose program matches", () => {
    expect(visibleTo(programNotice, student)).toBe(true);
    expect(visibleTo(programNotice, teacher)).toBe(true); // teacher has an offering in that program
    expect(visibleTo(programNotice, cr)).toBe(true);
    expect(visibleTo(programNotice, outsider)).toBe(false);
  });

  it("class scope is visible only to viewers in that class (student/CR) or a teacher assigned there", () => {
    expect(visibleTo(classNotice, student)).toBe(true);
    expect(visibleTo(classNotice, teacher)).toBe(true);
    expect(visibleTo(classNotice, cr)).toBe(true);
    expect(visibleTo(classNotice, outsider)).toBe(false);
  });

  it("a teacher assigned to a different class in the same program does not see a class-scoped notice for another class", () => {
    const otherClassNotice: NoticeEvent = { audienceScope: "class", programId: null, classId: "class-stat-9" };
    expect(visibleTo(otherClassNotice, teacher)).toBe(false);
  });

  it("class scope with a null classId is visible to nobody (defensive — should never occur given the schema, but the function must not throw or default-allow)", () => {
    const malformed: NoticeEvent = { audienceScope: "class", programId: null, classId: null };
    expect(visibleTo(malformed, student)).toBe(false);
  });
});
