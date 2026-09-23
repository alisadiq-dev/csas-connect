import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { testDb } from "../db";

vi.mock("@/db", async () => {
  const { testDb } = await import("../db");
  return { db: testDb };
});

const { createAuthUser, isRealSupabaseConfigured, verifyLocalCredentials } = await import("@/lib/identity/auth");

const createdUserIds: string[] = [];

afterAll(async () => {
  for (const userId of createdUserIds) {
    await testDb.execute(sql`delete from auth.local_credentials where user_id = ${userId}`);
    await testDb.execute(sql`delete from auth.users where id = ${userId}`);
  }
});

describe("lib/identity/auth (Task 11)", () => {
  it("isRealSupabaseConfigured is false without cloud env vars (this environment's actual state)", () => {
    expect(isRealSupabaseConfigured()).toBe(false);
  });

  it("createAuthUser (local path) creates an auth.users row and verifiable credentials", async () => {
    const email = `auth-test-${Date.now()}@example.test`;
    const { userId } = await createAuthUser({ email, password: "correct-horse-battery-staple" });
    createdUserIds.push(userId);

    expect(userId).toMatch(/^[0-9a-f-]{36}$/);

    const ok = await verifyLocalCredentials(email, "correct-horse-battery-staple");
    expect(ok).toEqual({ userId });

    const wrong = await verifyLocalCredentials(email, "not-the-password");
    expect(wrong).toBeNull();
  });

  it("verifyLocalCredentials returns null for an unknown email", async () => {
    const result = await verifyLocalCredentials("no-such-user@example.test", "whatever");
    expect(result).toBeNull();
  });
});
