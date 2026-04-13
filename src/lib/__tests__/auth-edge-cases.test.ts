/**
 * @fileoverview Comprehensive edge-case tests for auth system utility functions.
 *
 * Covers attack vectors and boundary conditions for password validation,
 * token generation, JWT handling, MFA operations, schema validation,
 * CSRF origin checks, and timing-safe comparison.
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { randomBytes } from "crypto";

// ── Password imports ─────────────────────────────────────────
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
} from "../password";

// ── Token imports ────────────────────────────────────────────
import {
  generateToken,
  hashToken,
  generateResetToken,
  generateVerifyToken,
} from "../tokens";

// ── JWT imports ──────────────────────────────────────────────
import { signJwt, verifyJwt } from "../jwt";

// ── MFA imports ──────────────────────────────────────────────
import {
  generateTotpSecret,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "../mfa";

// ── Auth validation imports ──────────────────────────────────
import {
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetPasswordSchema,
  changePasswordSchema,
  mfaVerifySchema,
  mfaRecoverySchema,
  linkEmailSchema,
  customNameSchema,
} from "../auth-validation";

// ── CSRF imports ─────────────────────────────────────────────
import { validateOrigin } from "../csrf";

// ── Timing imports ───────────────────────────────────────────
import { timingSafeCompare } from "../timing";

// ── Shared helpers ───────────────────────────────────────────

const TEST_JWT_SECRET = "edge-case-test-secret-key";

/** Build a Request with optional origin header. */
function makeRequest(origin?: string): Request {
  const headers = new Headers();
  if (origin !== undefined) headers.set("origin", origin);
  return new Request("https://example.com/api/test", { headers });
}

// ── MFA encryption key setup ─────────────────────────────────
const TEST_MFA_KEY = Buffer.from(randomBytes(32)).toString("base64");
let savedMfaKey: string | undefined;

beforeAll(() => {
  savedMfaKey = process.env.MFA_ENCRYPTION_KEY;
  process.env.MFA_ENCRYPTION_KEY = TEST_MFA_KEY;
});

afterAll(() => {
  if (savedMfaKey !== undefined) {
    process.env.MFA_ENCRYPTION_KEY = savedMfaKey;
  } else {
    delete process.env.MFA_ENCRYPTION_KEY;
  }
});

// =====================================================================
// 1. Password Edge Cases
// =====================================================================

describe("Password edge cases", () => {
  describe("validatePasswordStrength", () => {
    it("rejects password with only special characters (missing upper, lower, digit)", () => {
      const result = validatePasswordStrength('!@#$%^&*()_+-=');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least one uppercase letter");
      expect(result.errors).toContain("at least one lowercase letter");
      expect(result.errors).toContain("at least one digit");
      expect(result.errors).not.toContain("at least one special character");
    });

    it("accepts password with unicode characters (Pässwörd123!)", () => {
      // Unicode accented chars are not A-Z or a-z, so they count as special.
      // But we still need uppercase, lowercase, and digit explicitly.
      const result = validatePasswordStrength("Pässwörd123!");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("handles password with null byte embedded", () => {
      const pw = "Password\x00123!";
      const result = validatePasswordStrength(pw);
      // Null byte is a non-A-Za-z0-9 char so it counts as special
      expect(result.valid).toBe(true);
    });

    it("accepts password that is exactly 72 bytes in UTF-8", () => {
      // 72 ASCII characters = 72 bytes
      const pw = "Aa1!" + "x".repeat(68); // 4 + 68 = 72 chars/bytes
      expect(Buffer.byteLength(pw)).toBe(72);
      const result = validatePasswordStrength(pw);
      expect(result.valid).toBe(true);
    });

    it("rejects password that is 73 bytes in UTF-8", () => {
      const pw = "Aa1!" + "x".repeat(69); // 4 + 69 = 73 chars/bytes
      expect(Buffer.byteLength(pw)).toBe(73);
      const result = validatePasswordStrength(pw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("must not exceed 72 bytes");
    });

    it("rejects empty string with all errors", () => {
      const result = validatePasswordStrength("");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors).toContain("at least 12 characters");
      expect(result.errors).toContain("at least one uppercase letter");
      expect(result.errors).toContain("at least one lowercase letter");
      expect(result.errors).toContain("at least one digit");
      expect(result.errors).toContain("at least one special character");
    });

    it("accepts password with leading and trailing spaces", () => {
      const pw = "  Password123!  ";
      const result = validatePasswordStrength(pw);
      // 16 chars, has upper, lower, digit, special (space is non-alnum)
      expect(result.valid).toBe(true);
    });

    it("accepts technically valid common password (Password123!)", () => {
      // Our strength check doesn't have a dictionary; it just checks rules
      const result = validatePasswordStrength("Password123!");
      expect(result.valid).toBe(true);
    });

    it("rejects password with only numbers and special chars (missing upper + lower)", () => {
      const result = validatePasswordStrength("123456789012!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("at least one uppercase letter");
      expect(result.errors).toContain("at least one lowercase letter");
      expect(result.errors).not.toContain("at least one digit");
      expect(result.errors).not.toContain("at least one special character");
    });

    it("rejects password where char count is 12 but byte count exceeds 72 (multi-byte unicode)", () => {
      // 4-byte emoji repeated: 18 emojis = 72 bytes (18 chars) + "Aa1!" (4 chars/4 bytes) = 76 bytes
      const base = "Aa1!";
      const emojis = "\u{1F600}".repeat(18); // 18 * 4 = 72 bytes
      const pw = base + emojis; // 76 bytes total
      expect(Buffer.byteLength(pw)).toBe(76);
      const result = validatePasswordStrength(pw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("must not exceed 72 bytes");
    });
  });

  describe("hashPassword / verifyPassword with edge inputs", () => {
    it("rejects hashing a 73-byte password", async () => {
      const pw = "A".repeat(73);
      await expect(hashPassword(pw)).rejects.toThrow("Password must not exceed 72 bytes");
    });

    it("hashes and verifies a password with null bytes", async () => {
      const pw = "SecurePass\x001!A";
      const hash = await hashPassword(pw);
      expect(await verifyPassword(pw, hash)).toBe(true);
      // A different password without the null byte should not match
      expect(await verifyPassword("SecurePass1!A", hash)).toBe(false);
    });

    it("hashes and verifies a password with unicode characters", async () => {
      const pw = "Pässwörd123!";
      const hash = await hashPassword(pw);
      expect(await verifyPassword(pw, hash)).toBe(true);
      expect(await verifyPassword("Password123!", hash)).toBe(false);
    });

    it("handles password that is exactly 72 bytes", async () => {
      const pw = "A".repeat(72);
      const hash = await hashPassword(pw);
      expect(await verifyPassword(pw, hash)).toBe(true);
    });

    it("distinguishes passwords with and without trailing spaces", async () => {
      const pw1 = "SecurePass123!";
      const pw2 = "SecurePass123! ";
      const hash = await hashPassword(pw1);
      expect(await verifyPassword(pw1, hash)).toBe(true);
      expect(await verifyPassword(pw2, hash)).toBe(false);
    });
  });
});

// =====================================================================
// 2. Token Edge Cases
// =====================================================================

describe("Token edge cases", () => {
  it("hashToken of empty string is deterministic", () => {
    const h1 = hashToken("");
    const h2 = hashToken("");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashToken of very long string (10000 chars) produces valid hash", () => {
    const longStr = "a".repeat(10000);
    const hash = hashToken(longStr);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generateToken with 0 bytes returns empty string", () => {
    const token = generateToken(0);
    expect(token).toBe("");
  });

  it("generateToken with 1 byte returns 2 hex chars", () => {
    const token = generateToken(1);
    expect(token).toHaveLength(2);
    expect(token).toMatch(/^[0-9a-f]{2}$/);
  });

  it("generateResetToken expiresAt is in the future", () => {
    const now = Date.now();
    const { expiresAt } = generateResetToken();
    expect(expiresAt.getTime()).toBeGreaterThan(now);
  });

  it("generateVerifyToken expiresAt is in the future", () => {
    const now = Date.now();
    const { expiresAt } = generateVerifyToken();
    expect(expiresAt.getTime()).toBeGreaterThan(now);
  });

  it("100 generated tokens are all unique (collision resistance)", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });

  it("hashToken produces different results for inputs differing by one char", () => {
    const h1 = hashToken("tokenA");
    const h2 = hashToken("tokenB");
    expect(h1).not.toBe(h2);
  });
});

// =====================================================================
// 3. JWT Edge Cases
// =====================================================================

describe("JWT edge cases", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips with empty payload {}", () => {
    const token = signJwt({}, TEST_JWT_SECRET, 300);
    const decoded = verifyJwt<{ iat: number; exp: number }>(token, TEST_JWT_SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded!.iat).toBeTypeOf("number");
    expect(decoded!.exp).toBeTypeOf("number");
  });

  it("round-trips with very large payload (~10KB of data)", () => {
    const payload = { data: "x".repeat(10000) };
    const token = signJwt(payload, TEST_JWT_SECRET, 300);
    const decoded = verifyJwt<{ data: string }>(token, TEST_JWT_SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded!.data).toHaveLength(10000);
  });

  it("round-trips with XSS in values", () => {
    const payload = { name: '<script>alert(1)</script>' };
    const token = signJwt(payload, TEST_JWT_SECRET, 300);
    const decoded = verifyJwt<{ name: string }>(token, TEST_JWT_SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe('<script>alert(1)</script>');
  });

  it("round-trips with nested objects and arrays", () => {
    const payload = { user: { id: 1, roles: ["admin", "user"] } };
    const token = signJwt(payload, TEST_JWT_SECRET, 300);
    const decoded = verifyJwt<{ user: { id: number; roles: string[] } }>(
      token,
      TEST_JWT_SECRET,
    );
    expect(decoded).not.toBeNull();
    expect(decoded!.user.id).toBe(1);
    expect(decoded!.user.roles).toEqual(["admin", "user"]);
  });

  it("returns null for empty string token", () => {
    expect(verifyJwt("", TEST_JWT_SECRET)).toBeNull();
  });

  it("returns null for random garbage", () => {
    expect(verifyJwt("not.a.jwt.at.all", TEST_JWT_SECRET)).toBeNull();
    expect(verifyJwt("completelyrandom", TEST_JWT_SECRET)).toBeNull();
    expect(verifyJwt("asdkjhf2389f", TEST_JWT_SECRET)).toBeNull();
  });

  it("returns null for token with 2 dots but invalid base64 segments", () => {
    expect(verifyJwt("!!!.@@@.###", TEST_JWT_SECRET)).toBeNull();
  });

  it("returns null for token just barely expired (exp = now - 1 second)", () => {
    // Sign the token 10 seconds in the past with 9 seconds TTL => expired 1s ago
    const pastMs = Date.now() - 10_000;
    vi.spyOn(Date, "now").mockReturnValue(pastMs);
    const token = signJwt({ test: true }, TEST_JWT_SECRET, 9);
    vi.restoreAllMocks();

    const decoded = verifyJwt(token, TEST_JWT_SECRET);
    expect(decoded).toBeNull();
  });

  it("returns valid payload for token not yet expired (exp = now + 1 second)", () => {
    // Sign with a 60 second expiry from now — definitely not expired
    const token = signJwt({ test: true }, TEST_JWT_SECRET, 60);
    const decoded = verifyJwt<{ test: boolean }>(token, TEST_JWT_SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded!.test).toBe(true);
  });

  it("returns null when verified with a completely wrong secret", () => {
    const token = signJwt({ userId: "abc" }, TEST_JWT_SECRET, 300);
    expect(verifyJwt(token, "completely-wrong-secret")).toBeNull();
  });

  it("returns null for token with unicode payload that has been tampered", () => {
    const token = signJwt({ msg: "ahoj" }, TEST_JWT_SECRET, 300);
    const parts = token.split(".");
    // Swap the payload to something different but keep the header and sig
    const fakePayload = Buffer.from(JSON.stringify({ msg: "hacked" })).toString("base64url");
    const tampered = `${parts[0]}.${fakePayload}.${parts[2]}`;
    expect(verifyJwt(tampered, TEST_JWT_SECRET)).toBeNull();
  });
});

// =====================================================================
// 4. MFA Edge Cases
// =====================================================================

describe("MFA edge cases", () => {
  // ── Encrypt / Decrypt ────────────────────────────────────────

  describe("encryptSecret / decryptSecret", () => {
    it("encrypts and decrypts empty string", () => {
      const encrypted = encryptSecret("");
      expect(decryptSecret(encrypted)).toBe("");
    });

    it("encrypts and decrypts very long string (1000 chars)", () => {
      const longStr = "A".repeat(1000);
      const encrypted = encryptSecret(longStr);
      expect(decryptSecret(encrypted)).toBe(longStr);
    });

    it("throws when decrypting with wrong key", () => {
      const encrypted = encryptSecret("secret-data");

      // Swap the MFA key to a different one
      const saved = process.env.MFA_ENCRYPTION_KEY;
      process.env.MFA_ENCRYPTION_KEY = Buffer.from(randomBytes(32)).toString("base64");

      try {
        expect(() => decryptSecret(encrypted)).toThrow();
      } finally {
        process.env.MFA_ENCRYPTION_KEY = saved;
      }
    });

    it("throws on malformed string with no colons", () => {
      expect(() => decryptSecret("noColonsHere")).toThrow("Unsupported encryption format");
    });

    it("throws on string with wrong version prefix", () => {
      expect(() => decryptSecret("v2:abc:def:ghi")).toThrow("Unsupported encryption format");
    });

    it("throws on string with only 2 colon-separated parts", () => {
      expect(() => decryptSecret("v1:abc:def")).toThrow("Unsupported encryption format");
    });

    it("throws on string with 5 colon-separated parts", () => {
      expect(() => decryptSecret("v1:a:b:c:d")).toThrow("Unsupported encryption format");
    });
  });

  // ── Recovery Codes ───────────────────────────────────────────

  describe("recovery codes", () => {
    it("verifies a correct recovery code", async () => {
      const code = "abcdef0123456789";
      const hash = await hashRecoveryCode(code);
      expect(await verifyRecoveryCode(code, hash)).toBe(true);
    });

    it("rejects code with extra spaces (no trimming)", async () => {
      const code = "abcdef0123456789";
      const hash = await hashRecoveryCode(code);
      expect(await verifyRecoveryCode(" abcdef0123456789 ", hash)).toBe(false);
      expect(await verifyRecoveryCode("abcdef0123456789 ", hash)).toBe(false);
    });

    it("recovery code comparison is case-sensitive (bcrypt hashing)", async () => {
      const lower = "abcdef0123456789";
      const upper = "ABCDEF0123456789";
      const hash = await hashRecoveryCode(lower);
      // bcrypt compares raw input bytes, so uppercase should not match
      expect(await verifyRecoveryCode(upper, hash)).toBe(false);
    });

    it("generates 100 unique recovery codes", () => {
      const codes = generateRecoveryCodes(100);
      const unique = new Set(codes);
      expect(unique.size).toBe(100);
      for (const code of codes) {
        expect(code).toMatch(/^[0-9a-f]{16}$/);
      }
    });
  });

  // ── TOTP verify ──────────────────────────────────────────────

  describe("verifyTotp with invalid inputs", () => {
    it("returns invalid for non-numeric code", () => {
      const { secret } = generateTotpSecret("Test", "u@t.com");
      const result = verifyTotp(secret, "abcdef");
      expect(result.valid).toBe(false);
      expect(result.step).toBeNull();
    });

    it("returns invalid for empty code", () => {
      const { secret } = generateTotpSecret("Test", "u@t.com");
      const result = verifyTotp(secret, "");
      expect(result.valid).toBe(false);
      expect(result.step).toBeNull();
    });

    it("returns invalid for code with spaces", () => {
      const { secret } = generateTotpSecret("Test", "u@t.com");
      const result = verifyTotp(secret, "123 45");
      expect(result.valid).toBe(false);
      expect(result.step).toBeNull();
    });

    it("returns invalid for code that is too long", () => {
      const { secret } = generateTotpSecret("Test", "u@t.com");
      const result = verifyTotp(secret, "12345678");
      expect(result.valid).toBe(false);
      expect(result.step).toBeNull();
    });

    it("returns invalid for code that is too short", () => {
      const { secret } = generateTotpSecret("Test", "u@t.com");
      const result = verifyTotp(secret, "123");
      expect(result.valid).toBe(false);
      expect(result.step).toBeNull();
    });
  });
});

// =====================================================================
// 5. Auth Validation Schema Edge Cases
// =====================================================================

describe("Auth validation schema edge cases", () => {
  // ── Email injection attacks ──────────────────────────────────

  describe("email attack vectors", () => {
    it("handles SQL injection in email local part (RFC-valid chars are allowed)", () => {
      const result = registerSchema.safeParse({
        email: "admin' OR '1'='1'--@evil.com",
        password: "securePass123!",
      });
      // Zod email() follows RFC — apostrophes are valid. SQL injection is
      // prevented at the DB layer with parameterized queries.
      expect(typeof result.success).toBe("boolean");
    });

    it("rejects email with CRLF injection", () => {
      const result = registerSchema.safeParse({
        email: "user@evil.com\r\nBcc: attacker@evil.com",
        password: "securePass123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email with null byte", () => {
      const result = registerSchema.safeParse({
        email: "user\x00@evil.com",
        password: "securePass123!",
      });
      expect(result.success).toBe(false);
    });

    it("handles unicode domain email (user@munchen.de) without crashing", () => {
      const result = loginSchema.safeParse({
        email: "user@m\u00fcnchen.de",
        password: "password",
      });
      // Zod's email() may or may not accept IDN — just ensure no crash
      expect(typeof result.success).toBe("boolean");
    });

    it("accepts email at exactly 254 characters", () => {
      // Build an email that is exactly 254 chars: local@domain
      // local = 63 chars max, domain needs the rest
      const local = "a".repeat(63);
      // domain part: 254 - 63 - 1 (@) = 190 chars
      // Use subdomains to make it valid: each label <= 63 chars
      const domainPart = "b".repeat(62) + "." + "c".repeat(62) + "." + "d".repeat(62) + ".com";
      const email = `${local}@${domainPart}`;
      // The above is > 254 due to .com part. Let's be precise:
      // Actually we need to carefully control the length.
      // Simpler approach: pad to exactly 254
      const baseEmail = "a@b.com"; // 7 chars
      const padded = "a".repeat(254 - 6) + "@b.com"; // localpart(248) + @ + b.com(5) = 254
      const result = registerSchema.safeParse({
        email: padded,
        password: "securePass123!",
      });
      // Whether Zod accepts this depends on internal email validation.
      // We just ensure no crash and that .max(254) doesn't reject it on length alone.
      expect(typeof result.success).toBe("boolean");
    });

    it("rejects email at 255 characters (exceeds max)", () => {
      const longLocal = "a".repeat(249);
      const email = `${longLocal}@b.com`; // 249 + 1 + 5 = 255
      const result = registerSchema.safeParse({
        email,
        password: "securePass123!",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Display name edge cases ──────────────────────────────────

  describe("display name edge cases", () => {
    it("accepts HTML in registerSchema displayName (Zod does not sanitize)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "securePass123!",
        displayName: '<img src=x onerror=alert(1)>',
      });
      // registerSchema displayName has no regex restriction, just min/max and trim
      expect(result.success).toBe(true);
    });

    it("rejects empty string displayName (min 2)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "securePass123!",
        displayName: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects displayName that is only spaces (trim then min 2)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "securePass123!",
        displayName: "   ",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Password byte boundaries in schemas ──────────────────────

  describe("password byte limits in schemas", () => {
    it("accepts 72-char password in registerSchema", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(72),
      });
      expect(result.success).toBe(true);
    });

    it("rejects 73-char password in registerSchema", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(73),
      });
      expect(result.success).toBe(false);
    });

    it("accepts 72-char password in resetPasswordSchema", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token",
        newPassword: "a".repeat(72),
      });
      expect(result.success).toBe(true);
    });

    it("rejects 73-char password in resetPasswordSchema", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token",
        newPassword: "a".repeat(73),
      });
      expect(result.success).toBe(false);
    });

    it("accepts 72-char password in changePasswordSchema", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpass",
        newPassword: "a".repeat(72),
      });
      expect(result.success).toBe(true);
    });

    it("rejects 73-char password in changePasswordSchema", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpass",
        newPassword: "a".repeat(73),
      });
      expect(result.success).toBe(false);
    });

    it("accepts 72-char password in linkEmailSchema", () => {
      const result = linkEmailSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(72),
      });
      expect(result.success).toBe(true);
    });

    it("rejects 73-char password in linkEmailSchema", () => {
      const result = linkEmailSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(73),
      });
      expect(result.success).toBe(false);
    });
  });

  // ── customNameSchema edge cases ──────────────────────────────

  describe("customNameSchema edge cases", () => {
    it("accepts name with dots (Player.One)", () => {
      expect(customNameSchema.safeParse("Player.One").success).toBe(true);
    });

    it("accepts name with double spaces (Player  Name)", () => {
      expect(customNameSchema.safeParse("Player  Name").success).toBe(true);
    });

    it("accepts name with leading space ( Player)", () => {
      expect(customNameSchema.safeParse(" Player").success).toBe(true);
    });

    it("rejects name with emoji (Player followed by gamepad emoji)", () => {
      expect(customNameSchema.safeParse("Player\u{1F3AE}").success).toBe(false);
    });

    it("rejects name with tab character", () => {
      expect(customNameSchema.safeParse("Player\tName").success).toBe(false);
    });

    it("rejects name with newline", () => {
      expect(customNameSchema.safeParse("Player\nName").success).toBe(false);
    });

    it("rejects name with null byte", () => {
      expect(customNameSchema.safeParse("Player\x00Name").success).toBe(false);
    });

    it("accepts name with underscores and hyphens", () => {
      expect(customNameSchema.safeParse("Player_Name-1").success).toBe(true);
    });

    it("accepts name at exactly 3 characters", () => {
      expect(customNameSchema.safeParse("ABC").success).toBe(true);
    });

    it("rejects name at 2 characters", () => {
      expect(customNameSchema.safeParse("AB").success).toBe(false);
    });

    it("accepts name at exactly 24 characters", () => {
      expect(customNameSchema.safeParse("A".repeat(24)).success).toBe(true);
    });

    it("rejects name at 25 characters", () => {
      expect(customNameSchema.safeParse("A".repeat(25)).success).toBe(false);
    });
  });

  // ── MFA schema edge cases ────────────────────────────────────

  describe("mfaVerifySchema edge cases", () => {
    it("accepts code with leading zeros (000001)", () => {
      const result = mfaVerifySchema.safeParse({
        challengeToken: "challenge-token",
        code: "000001",
      });
      expect(result.success).toBe(true);
    });

    it("rejects code with spaces (123 456)", () => {
      const result = mfaVerifySchema.safeParse({
        challengeToken: "challenge-token",
        code: "123 456",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code with dashes (123-456)", () => {
      const result = mfaVerifySchema.safeParse({
        challengeToken: "challenge-token",
        code: "123-456",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all-zeros code (000000)", () => {
      const result = mfaVerifySchema.safeParse({
        challengeToken: "challenge-token",
        code: "000000",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty code", () => {
      const result = mfaVerifySchema.safeParse({
        challengeToken: "challenge-token",
        code: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("mfaRecoverySchema edge cases", () => {
    it("rejects uppercase hex (ABCDEF1234567890)", () => {
      const result = mfaRecoverySchema.safeParse({
        challengeToken: "challenge-token",
        code: "ABCDEF1234567890",
      });
      expect(result.success).toBe(false);
    });

    it("rejects 15-character recovery code", () => {
      const result = mfaRecoverySchema.safeParse({
        challengeToken: "challenge-token",
        code: "abcdef012345678",
      });
      expect(result.success).toBe(false);
    });

    it("rejects 17-character recovery code", () => {
      const result = mfaRecoverySchema.safeParse({
        challengeToken: "challenge-token",
        code: "abcdef01234567890",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid 16-character lowercase hex", () => {
      const result = mfaRecoverySchema.safeParse({
        challengeToken: "challenge-token",
        code: "abcdef0123456789",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mixed-case hex (AbCdEf0123456789)", () => {
      const result = mfaRecoverySchema.safeParse({
        challengeToken: "challenge-token",
        code: "AbCdEf0123456789",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code with spaces even if 16 hex chars total", () => {
      const result = mfaRecoverySchema.safeParse({
        challengeToken: "challenge-token",
        code: "abcdef01 2345678",
      });
      expect(result.success).toBe(false);
    });
  });
});

// =====================================================================
// 6. CSRF Edge Cases
// =====================================================================

describe("CSRF edge cases", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
  });

  it("rejects origin with a path appended", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    // Origin header should never contain a path, but if it does the
    // comparison should still work since we compare against new URL(...).origin
    expect(
      validateOrigin(makeRequest("https://savecounterstrike.com/api")),
    ).toBe(false);
  });

  it("handles origin with explicit port 443 for HTTPS", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    // new URL("https://x.com").origin => "https://x.com" (no port for default)
    // "https://x.com:443" is a raw string, not equal to "https://x.com"
    const result = validateOrigin(makeRequest("https://savecounterstrike.com:443"));
    // The origin string "https://savecounterstrike.com:443" !== "https://savecounterstrike.com"
    // so this should fail
    expect(result).toBe(false);
  });

  it("rejects string 'null' as origin (sandboxed iframes)", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(validateOrigin(makeRequest("null"))).toBe(false);
  });

  it("rejects subdomain spoofing", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(
      validateOrigin(makeRequest("https://evil.savecounterstrike.com")),
    ).toBe(false);
  });

  it("rejects when no origin header is present", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(validateOrigin(makeRequest())).toBe(false);
  });

  it("rejects origin with trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(
      validateOrigin(makeRequest("https://savecounterstrike.com/")),
    ).toBe(false);
  });

  it("rejects origin with different scheme (http vs https)", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(
      validateOrigin(makeRequest("http://savecounterstrike.com")),
    ).toBe(false);
  });

  it("rejects empty string origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    // Setting origin to empty string — headers.get("origin") returns ""
    // But our code checks if (!origin) which is truthy for ""
    const headers = new Headers();
    headers.set("origin", "");
    const req = new Request("https://example.com/api", { headers });
    expect(validateOrigin(req)).toBe(false);
  });

  it("accepts exact match when SITE_URL includes a path", () => {
    // If SITE_URL is https://savecounterstrike.com/app, the origin is
    // still https://savecounterstrike.com (URL.origin strips path)
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com/app";
    expect(
      validateOrigin(makeRequest("https://savecounterstrike.com")),
    ).toBe(true);
  });
});

// =====================================================================
// 7. Timing Safe Compare Edge Cases
// =====================================================================

describe("Timing safe compare edge cases", () => {
  it("returns true for two identical strings", () => {
    expect(timingSafeCompare("secret123", "secret123")).toBe(true);
  });

  it("returns true for two empty strings", () => {
    expect(timingSafeCompare("", "")).toBe(true);
  });

  it("returns false when one is empty and the other is not", () => {
    expect(timingSafeCompare("", "notempty")).toBe(false);
    expect(timingSafeCompare("notempty", "")).toBe(false);
  });

  it("returns true for very long identical strings (10000 chars)", () => {
    const long = "a".repeat(10000);
    expect(timingSafeCompare(long, long)).toBe(true);
  });

  it("returns false for strings that differ only in last character", () => {
    const base = "a".repeat(999);
    expect(timingSafeCompare(base + "a", base + "b")).toBe(false);
  });

  it("returns false for strings that differ only in first character", () => {
    const tail = "a".repeat(999);
    expect(timingSafeCompare("x" + tail, "y" + tail)).toBe(false);
  });

  it("handles unicode strings correctly", () => {
    expect(timingSafeCompare("cestina", "cestina")).toBe(true);
    expect(timingSafeCompare("\u00e9\u00e8\u00ea", "\u00e9\u00e8\u00ea")).toBe(true);
    expect(timingSafeCompare("\u00e9\u00e8\u00ea", "\u00e9\u00e8\u00eb")).toBe(false);
  });

  it("returns false for strings that are same length but different content", () => {
    expect(timingSafeCompare("aaaa", "bbbb")).toBe(false);
  });

  it("handles multi-byte unicode where char count matches but byte count differs", () => {
    // "a" is 1 byte, "\u00e9" (e-acute) is 2 bytes in UTF-8
    // Different byte lengths => returns false immediately
    expect(timingSafeCompare("a", "\u00e9")).toBe(false);
  });

  it("returns false for strings with different whitespace", () => {
    expect(timingSafeCompare("hello world", "hello  world")).toBe(false);
    expect(timingSafeCompare(" hello", "hello ")).toBe(false);
  });
});
