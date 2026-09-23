import { describe, expect, it } from "vitest";
import { testDb } from "../db";
import { batches, classes, programs } from "@/db/schema/academic-structure";

describe("academic-structure schema (Task 5): programs, batches, classes", () => {
  it("inserts a program, a batch, and its regular+replica classes", async () => {
    const [program] = await testDb
      .insert(programs)
      .values({ name: "BS Statistics (schema test)", code: `STAT-${Date.now()}` })
      .returning();

    const [batch] = await testDb
      .insert(batches)
      .values({ programId: program.id, intakeYear: 2024 })
      .returning();

    const [regular] = await testDb
      .insert(classes)
      .values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 })
      .returning();
    const [replica] = await testDb
      .insert(classes)
      .values({ batchId: batch.id, sectionType: "replica", currentSemester: 1 })
      .returning();

    expect(regular.sectionType).toBe("regular");
    expect(replica.sectionType).toBe("replica");
  });

  it("rejects a duplicate (batch_id, section_type) pair", async () => {
    const [program] = await testDb
      .insert(programs)
      .values({ name: "BS Biostatistics (schema test)", code: `BIOSTAT-${Date.now()}` })
      .returning();
    const [batch] = await testDb
      .insert(batches)
      .values({ programId: program.id, intakeYear: 2025 })
      .returning();

    await testDb.insert(classes).values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 });

    await expect(
      testDb.insert(classes).values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate (program_id, intake_year) pair", async () => {
    const [program] = await testDb
      .insert(programs)
      .values({ name: "BS Computational Statistics (schema test)", code: `CS-${Date.now()}` })
      .returning();

    await testDb.insert(batches).values({ programId: program.id, intakeYear: 2026 });

    await expect(
      testDb.insert(batches).values({ programId: program.id, intakeYear: 2026 }),
    ).rejects.toThrow();
  });
});
