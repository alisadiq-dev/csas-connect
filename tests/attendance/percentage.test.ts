import { describe, expect, it } from "vitest";
import { attendancePercentage } from "@/lib/attendance/percentage";

describe("attendancePercentage (Task 19)", () => {
  it("returns 0 for zero sessions", () => {
    expect(attendancePercentage([])).toBe(0);
  });

  it("returns 0 when every record is leave (leave does not count toward present)", () => {
    expect(attendancePercentage([{ status: "leave" }, { status: "leave" }])).toBe(0);
  });

  it("returns 100 when every record is present", () => {
    expect(attendancePercentage([{ status: "present" }, { status: "present" }])).toBe(100);
  });

  it("rounds to the nearest whole percent", () => {
    // 2/3 present = 66.66...% -> rounds to 67
    expect(
      attendancePercentage([{ status: "present" }, { status: "present" }, { status: "absent" }]),
    ).toBe(67);
  });

  it("treats leave the same as absent in the denominator (not counted as present)", () => {
    expect(
      attendancePercentage([{ status: "present" }, { status: "leave" }, { status: "absent" }, { status: "present" }]),
    ).toBe(50);
  });
});
