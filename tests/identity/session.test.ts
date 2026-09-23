import { describe, expect, it } from "vitest";
import { decodeSessionToken, encodeSessionToken } from "@/lib/identity/session";

describe("session token signing (Task 14)", () => {
  it("round-trips a valid payload", () => {
    const token = encodeSessionToken({ userId: "11111111-1111-1111-1111-111111111111", role: "student" });
    const decoded = decodeSessionToken(token);
    expect(decoded).toEqual({ userId: "11111111-1111-1111-1111-111111111111", role: "student" });
  });

  it("rejects a tampered payload (different role, same signature format)", () => {
    const token = encodeSessionToken({ userId: "11111111-1111-1111-1111-111111111111", role: "student" });
    const [body, signature] = token.split(".");
    const tamperedBody = Buffer.from(JSON.stringify({ userId: "11111111-1111-1111-1111-111111111111", role: "admin" })).toString(
      "base64url",
    );
    const tamperedToken = `${tamperedBody}.${signature}`;
    expect(tamperedToken).not.toBe(token);
    expect(decodeSessionToken(tamperedToken)).toBeNull();
    void body;
  });

  it("rejects garbage tokens", () => {
    expect(decodeSessionToken("not-a-real-token")).toBeNull();
    expect(decodeSessionToken("")).toBeNull();
  });

  it("rejects a token with an invalid role", () => {
    const forged = `${Buffer.from(JSON.stringify({ userId: "x", role: "superadmin" })).toString("base64url")}.deadbeef`;
    expect(decodeSessionToken(forged)).toBeNull();
  });
});
