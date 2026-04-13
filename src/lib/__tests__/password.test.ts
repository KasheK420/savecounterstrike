import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "crypto";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  checkBreachedPassword,
} from "../password";

// ---------------------------------------------------------------------------
// hashPassword
// ---------------------------------------------------------------------------
describe("hashPassword", () => {
  it("returns a bcrypt hash string", async () => {
    const hash = await hashPassword("SecurePass123!");
    expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/);
  });

  it("produces different hashes for the same input (unique salt)", async () => {
    const a = await hashPassword("SecurePass123!");
    const b = await hashPassword("SecurePass123!");
    expect(a).not.toBe(b);
  });

  it("rejects passwords exceeding 72 bytes", async () => {
    const longPassword = "A".repeat(73);
    await expect(hashPassword(longPassword)).rejects.toThrow(
      "Password must not exceed 72 bytes",
    );
  });

  it("accepts a password that is exactly 72 bytes", async () => {
    const password = "A".repeat(72);
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/);
  });
});

// ---------------------------------------------------------------------------
// verifyPassword
// ---------------------------------------------------------------------------
describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const password = "CorrectHorse1!";
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("returns false for an incorrect password", async () => {
    const hash = await hashPassword("CorrectHorse1!");
    expect(await verifyPassword("WrongPassword1!", hash)).toBe(false);
  });

  it("returns false for an empty password against a real hash", async () => {
    const hash = await hashPassword("SomethingValid1!");
    expect(await verifyPassword("", hash)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validatePasswordStrength
// ---------------------------------------------------------------------------
describe("validatePasswordStrength", () => {
  it("accepts a valid password", () => {
    const result = validatePasswordStrength("StrongPass12!!");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a password that is too short", () => {
    const result = validatePasswordStrength("Short1!aB");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least 12 characters");
  });

  it("rejects a password missing uppercase letters", () => {
    const result = validatePasswordStrength("alllowercase1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one uppercase letter");
  });

  it("rejects a password missing lowercase letters", () => {
    const result = validatePasswordStrength("ALLUPPERCASE1!!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one lowercase letter");
  });

  it("rejects a password missing digits", () => {
    const result = validatePasswordStrength("NoDigitsHere!!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one digit");
  });

  it("rejects a password missing special characters", () => {
    const result = validatePasswordStrength("NoSpecial1234A");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one special character");
  });

  it("collects all errors for an empty string", () => {
    const result = validatePasswordStrength("");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least 12 characters");
    expect(result.errors).toContain("at least one uppercase letter");
    expect(result.errors).toContain("at least one lowercase letter");
    expect(result.errors).toContain("at least one digit");
    expect(result.errors).toContain("at least one special character");
  });

  it("accepts a password that is exactly 12 characters", () => {
    // 12 chars: uppercase, lowercase, digit, special
    const result = validatePasswordStrength("Abcdefghij1!");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("handles unicode characters correctly", () => {
    // Unicode chars count as special (non-A-Za-z0-9) and contribute bytes
    const result = validatePasswordStrength("Abcdefghij1\u00e9");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a password exceeding 72 bytes", () => {
    // Build a valid-looking password that exceeds 72 bytes
    // Each 4-byte emoji pushes us over quickly
    const base = "Aa1!";
    const filler = "\u{1F600}".repeat(18); // 18 * 4 = 72 bytes + 4 for base = 76
    const result = validatePasswordStrength(base + filler);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("must not exceed 72 bytes");
  });
});

// ---------------------------------------------------------------------------
// checkBreachedPassword (mocked fetch)
// ---------------------------------------------------------------------------
describe("checkBreachedPassword", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function hibpSuffix(password: string): string {
    return createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase()
      .slice(5);
  }

  it("returns true when the password is found in breach data", async () => {
    const suffix = hibpSuffix("password123");
    const body = [
      "0000000000000000000000000000000AAAA:3",
      `${suffix}:99421`,
      "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF1234:1",
    ].join("\r\n");

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    expect(await checkBreachedPassword("password123")).toBe(true);
  });

  it("returns false when the password is not in breach data", async () => {
    const body = [
      "0000000000000000000000000000000AAAA:3",
      "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF1234:1",
    ].join("\r\n");

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    expect(await checkBreachedPassword("totallyUniqueP@ss99")).toBe(false);
  });

  it("returns false when the API responds with a non-OK status", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Service Unavailable", { status: 503 }),
    );

    expect(await checkBreachedPassword("anyPassword1!")).toBe(false);
  });

  it("returns false when the API request times out or throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    expect(await checkBreachedPassword("anyPassword1!")).toBe(false);
  });
});
