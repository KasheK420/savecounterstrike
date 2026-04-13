import { describe, it, expect } from "vitest";
import {
  generateToken,
  hashToken,
  generateResetToken,
  generateVerifyToken,
  generateMfaChallengeNonce,
} from "../tokens";

describe("generateToken", () => {
  it("returns a hex string of correct length (32 bytes = 64 hex chars)", () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("supports custom byte size", () => {
    const token16 = generateToken(16);
    expect(token16).toHaveLength(32);
    expect(token16).toMatch(/^[0-9a-f]{32}$/);

    const token64 = generateToken(64);
    expect(token64).toHaveLength(128);
    expect(token64).toMatch(/^[0-9a-f]{128}$/);
  });

  it("generates unique tokens on each call", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()));
    expect(tokens.size).toBe(50);
  });
});

describe("hashToken", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const hash = hashToken("test-token");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input always produces same hash", () => {
    const input = "deterministic-input";
    expect(hashToken(input)).toBe(hashToken(input));
  });

  it("produces different hashes for different tokens", () => {
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });
});

describe("generateResetToken", () => {
  it("returns an object with raw, hash, and expiresAt", () => {
    const result = generateResetToken();
    expect(result).toHaveProperty("raw");
    expect(result).toHaveProperty("hash");
    expect(result).toHaveProperty("expiresAt");
  });

  it("raw is a 64-char hex string", () => {
    const { raw } = generateResetToken();
    expect(raw).toHaveLength(64);
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hash matches hashToken(raw)", () => {
    const { raw, hash } = generateResetToken();
    expect(hash).toBe(hashToken(raw));
  });

  it("expiresAt is approximately 30 minutes in the future", () => {
    const before = Date.now();
    const { expiresAt } = generateResetToken();
    const after = Date.now();

    const thirtyMinMs = 30 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + thirtyMinMs);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + thirtyMinMs);
  });
});

describe("generateVerifyToken", () => {
  it("returns an object with raw, hash, and expiresAt", () => {
    const result = generateVerifyToken();
    expect(result).toHaveProperty("raw");
    expect(result).toHaveProperty("hash");
    expect(result).toHaveProperty("expiresAt");
  });

  it("raw is a 64-char hex string", () => {
    const { raw } = generateVerifyToken();
    expect(raw).toHaveLength(64);
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hash matches hashToken(raw)", () => {
    const { raw, hash } = generateVerifyToken();
    expect(hash).toBe(hashToken(raw));
  });

  it("expiresAt is approximately 24 hours in the future", () => {
    const before = Date.now();
    const { expiresAt } = generateVerifyToken();
    const after = Date.now();

    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + twentyFourHoursMs);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + twentyFourHoursMs);
  });
});

describe("generateMfaChallengeNonce", () => {
  it("returns a 64-char hex string", () => {
    const nonce = generateMfaChallengeNonce();
    expect(nonce).toHaveLength(64);
    expect(nonce).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique nonces on each call", () => {
    const nonces = new Set(Array.from({ length: 50 }, () => generateMfaChallengeNonce()));
    expect(nonces.size).toBe(50);
  });
});
