import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "crypto";
import { TOTP, Secret } from "otpauth";
import {
  generateTotpSecret,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  hashRecoveryCode,
  verifyRecoveryCode,
  generateRecoveryCodes,
} from "../mfa";

const TEST_KEY = Buffer.from(randomBytes(32)).toString("base64");
let originalKey: string | undefined;

beforeAll(() => {
  originalKey = process.env.MFA_ENCRYPTION_KEY;
  process.env.MFA_ENCRYPTION_KEY = TEST_KEY;
});

afterAll(() => {
  if (originalKey !== undefined) {
    process.env.MFA_ENCRYPTION_KEY = originalKey;
  } else {
    delete process.env.MFA_ENCRYPTION_KEY;
  }
});

/* ------------------------------------------------------------------ */
/*  generateTotpSecret                                                 */
/* ------------------------------------------------------------------ */
describe("generateTotpSecret", () => {
  it("returns a base32-encoded secret", () => {
    const { secret } = generateTotpSecret("TestIssuer", "user@example.com");
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });

  it("returns an otpauthUri containing issuer and account", () => {
    const { otpauthUri } = generateTotpSecret("MyApp", "alice@example.com");
    expect(otpauthUri).toContain("otpauth://totp/");
    expect(otpauthUri).toContain("MyApp");
    expect(otpauthUri).toContain("alice%40example.com");
  });

  it("generates unique secrets on each call", () => {
    const a = generateTotpSecret("App", "user@test.com");
    const b = generateTotpSecret("App", "user@test.com");
    expect(a.secret).not.toBe(b.secret);
  });
});

/* ------------------------------------------------------------------ */
/*  verifyTotp                                                         */
/* ------------------------------------------------------------------ */
describe("verifyTotp", () => {
  function generateCurrentCode(base32Secret: string): string {
    const totp = new TOTP({
      secret: Secret.fromBase32(base32Secret),
      digits: 6,
      period: 30,
      algorithm: "SHA1",
    });
    return totp.generate();
  }

  it("returns valid: true with correct code", () => {
    const { secret } = generateTotpSecret("Test", "u@t.com");
    const code = generateCurrentCode(secret);
    const result = verifyTotp(secret, code);
    expect(result.valid).toBe(true);
    expect(result.step).toBeTypeOf("number");
  });

  it("returns valid: false with wrong code", () => {
    const { secret } = generateTotpSecret("Test", "u@t.com");
    const result = verifyTotp(secret, "000000");
    expect(result.valid).toBe(false);
    expect(result.step).toBeNull();
  });

  it("works when lastStep is null", () => {
    const { secret } = generateTotpSecret("Test", "u@t.com");
    const code = generateCurrentCode(secret);
    const result = verifyTotp(secret, code, null);
    expect(result.valid).toBe(true);
    expect(result.step).toBeTypeOf("number");
  });

  it("works when lastStep is undefined", () => {
    const { secret } = generateTotpSecret("Test", "u@t.com");
    const code = generateCurrentCode(secret);
    const result = verifyTotp(secret, code, undefined);
    expect(result.valid).toBe(true);
  });

  it("rejects replay when same step is reused", () => {
    const { secret } = generateTotpSecret("Test", "u@t.com");
    const code = generateCurrentCode(secret);
    const first = verifyTotp(secret, code);
    expect(first.valid).toBe(true);

    // Same code, same step => replay
    const second = verifyTotp(secret, code, first.step);
    expect(second.valid).toBe(false);
    expect(second.step).toBeNull();
  });

  it("rejects code from an earlier step", () => {
    const { secret } = generateTotpSecret("Test", "u@t.com");
    const code = generateCurrentCode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);

    // Pretend last used step is far in the future
    const result = verifyTotp(secret, code, currentStep + 1000);
    expect(result.valid).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  encryptSecret / decryptSecret                                      */
/* ------------------------------------------------------------------ */
describe("encryptSecret / decryptSecret", () => {
  it("round-trips: decrypt(encrypt(x)) === x", () => {
    const plaintext = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptSecret(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("round-trips with empty string", () => {
    const encrypted = encryptSecret("");
    expect(decryptSecret(encrypted)).toBe("");
  });

  it("round-trips with unicode content", () => {
    const plaintext = "secret-klíč-čeština-🔑";
    const encrypted = encryptSecret(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("encrypted output starts with v1:", () => {
    const encrypted = encryptSecret("test");
    expect(encrypted).toMatch(/^v1:/);
  });

  it("encrypted output has 4 colon-separated parts", () => {
    const encrypted = encryptSecret("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(4);
  });

  it("different inputs produce different ciphertexts", () => {
    const a = encryptSecret("secret-a");
    const b = encryptSecret("secret-b");
    expect(a).not.toBe(b);
  });

  it("same input produces different ciphertexts (random IV)", () => {
    const a = encryptSecret("same-input");
    const b = encryptSecret("same-input");
    expect(a).not.toBe(b);
    // But both decrypt to the same value
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptSecret("test");
    const parts = encrypted.split(":");
    // Corrupt the ciphertext portion
    const ctBuf = Buffer.from(parts[2], "base64");
    ctBuf[0] ^= 0xff;
    parts[2] = ctBuf.toString("base64");
    const tampered = parts.join(":");

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws on tampered auth tag", () => {
    const encrypted = encryptSecret("test");
    const parts = encrypted.split(":");
    const tagBuf = Buffer.from(parts[3], "base64");
    tagBuf[0] ^= 0xff;
    parts[3] = tagBuf.toString("base64");
    const tampered = parts.join(":");

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws on unsupported version prefix", () => {
    const encrypted = encryptSecret("test");
    const tampered = encrypted.replace(/^v1:/, "v2:");
    expect(() => decryptSecret(tampered)).toThrow("Unsupported encryption format");
  });

  it("throws on malformed input (wrong number of parts)", () => {
    expect(() => decryptSecret("v1:abc:def")).toThrow(
      "Unsupported encryption format"
    );
  });

  it("throws when MFA_ENCRYPTION_KEY is missing", () => {
    const saved = process.env.MFA_ENCRYPTION_KEY;
    delete process.env.MFA_ENCRYPTION_KEY;
    try {
      expect(() => encryptSecret("test")).toThrow(
        "MFA_ENCRYPTION_KEY environment variable is not set"
      );
      expect(() => decryptSecret("v1:a:b:c")).toThrow(
        "MFA_ENCRYPTION_KEY environment variable is not set"
      );
    } finally {
      process.env.MFA_ENCRYPTION_KEY = saved;
    }
  });

  it("throws when MFA_ENCRYPTION_KEY is wrong length", () => {
    const saved = process.env.MFA_ENCRYPTION_KEY;
    process.env.MFA_ENCRYPTION_KEY = Buffer.from("too-short").toString("base64");
    try {
      expect(() => encryptSecret("test")).toThrow("must decode to 32 bytes");
    } finally {
      process.env.MFA_ENCRYPTION_KEY = saved;
    }
  });
});

/* ------------------------------------------------------------------ */
/*  hashRecoveryCode / verifyRecoveryCode                              */
/* ------------------------------------------------------------------ */
describe("hashRecoveryCode / verifyRecoveryCode", () => {
  it("correct code verifies", async () => {
    const code = "abcdef1234567890";
    const hash = await hashRecoveryCode(code);
    expect(await verifyRecoveryCode(code, hash)).toBe(true);
  });

  it("wrong code does not verify", async () => {
    const hash = await hashRecoveryCode("correct-code");
    expect(await verifyRecoveryCode("wrong-code", hash)).toBe(false);
  });

  it("hash is a bcrypt string", async () => {
    const hash = await hashRecoveryCode("some-code");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("different codes produce different hashes", async () => {
    const h1 = await hashRecoveryCode("code-1");
    const h2 = await hashRecoveryCode("code-2");
    expect(h1).not.toBe(h2);
  });
});

/* ------------------------------------------------------------------ */
/*  generateRecoveryCodes                                              */
/* ------------------------------------------------------------------ */
describe("generateRecoveryCodes", () => {
  it("returns 10 codes by default", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
  });

  it("returns the requested number of codes", () => {
    expect(generateRecoveryCodes(5)).toHaveLength(5);
    expect(generateRecoveryCodes(1)).toHaveLength(1);
    expect(generateRecoveryCodes(20)).toHaveLength(20);
  });

  it("each code is a 16-character hex string", () => {
    const codes = generateRecoveryCodes();
    for (const code of codes) {
      expect(code).toHaveLength(16);
      expect(code).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it("all codes are unique", () => {
    const codes = generateRecoveryCodes(50);
    const unique = new Set(codes);
    expect(unique.size).toBe(50);
  });
});
