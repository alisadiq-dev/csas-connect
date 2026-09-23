import { describe, expect, it } from "vitest";
import { validateSlot, type ExistingSlot } from "@/lib/timetable/validate";

const existing: ExistingSlot[] = [
  { id: "slot-1", classId: "class-A", teacherId: "teacher-1", dayOfWeek: "mon", periodNumber: 1 },
  { id: "slot-2", classId: "class-B", teacherId: "teacher-2", dayOfWeek: "tue", periodNumber: 3 },
];

describe("validateSlot (Task 31)", () => {
  it("rejects the same class double-booked in the same day/period", () => {
    const result = validateSlot({ classId: "class-A", teacherId: "teacher-9", dayOfWeek: "mon", periodNumber: 1 }, existing);
    expect(result.ok).toBe(false);
  });

  it("rejects the same teacher double-booked across two different classes/programs in the same day/period", () => {
    const result = validateSlot({ classId: "class-C", teacherId: "teacher-1", dayOfWeek: "mon", periodNumber: 1 }, existing);
    expect(result.ok).toBe(false);
  });

  it("accepts a valid, non-conflicting new slot", () => {
    const result = validateSlot({ classId: "class-C", teacherId: "teacher-3", dayOfWeek: "wed", periodNumber: 2 }, existing);
    expect(result.ok).toBe(true);
  });

  it("does not conflict with itself when excludeSlotId is passed (update path)", () => {
    const result = validateSlot(
      { classId: "class-A", teacherId: "teacher-1", dayOfWeek: "mon", periodNumber: 1 },
      existing,
      "slot-1",
    );
    expect(result.ok).toBe(true);
  });

  it("a class conflict is independent of period — different period on the same day is fine", () => {
    const result = validateSlot({ classId: "class-A", teacherId: "teacher-9", dayOfWeek: "mon", periodNumber: 2 }, existing);
    expect(result.ok).toBe(true);
  });
});
