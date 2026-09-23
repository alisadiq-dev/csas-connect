import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

// This suite tests the LOCAL fallback path specifically, which only exists
// while no real Supabase project is configured. Whatever real deployment
// credentials .env.local happens to carry (e.g. once a cloud project is
// connected) must not change what this suite exercises — stub the cloud env
// vars to unset for every test here, restoring the real values afterward.
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("lib/identity/auth (Task 11)", () => {
  it("isRealSupabaseConfigured is false without cloud env vars", () => {
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
