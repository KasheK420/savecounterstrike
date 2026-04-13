import { describe, it, expect, vi, afterEach } from "vitest";
import { signJwt, verifyJwt } from "../jwt";

const TEST_SECRET = "test-secret-key-for-jwt-tests";

// ── signJwt + verifyJwt round-trip ──────────────────────────

describe("signJwt / verifyJwt", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips: sign then verify returns the original payload", () => {
    const payload = { userId: "user_123", role: "admin" };
    const token = signJwt(payload, TEST_SECRET, 300);
    const decoded = verifyJwt<typeof payload & { iat: number; exp: number }>(
      token,
      TEST_SECRET,
    );

    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("user_123");
    expect(decoded!.role).toBe("admin");
  });

  it("preserves all payload data including nested objects", () => {
    const payload = {
      sub: "abc",
      data: { nested: true, count: 42 },
      tags: ["a", "b"],
    };
    const token = signJwt(payload, TEST_SECRET, 60);
    const decoded = verifyJwt<typeof payload>(token, TEST_SECRET);

    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe("abc");
    expect(decoded!.data).toEqual({ nested: true, count: 42 });
    expect(decoded!.tags).toEqual(["a", "b"]);
  });

  it("includes iat and exp claims", () => {
    const before = Math.floor(Date.now() / 1000);
    const token = signJwt({ foo: "bar" }, TEST_SECRET, 120);
    const after = Math.floor(Date.now() / 1000);

    const decoded = verifyJwt<{ foo: string; iat: number; exp: number }>(
      token,
      TEST_SECRET,
    );

    expect(decoded).not.toBeNull();
    expect(decoded!.iat).toBeGreaterThanOrEqual(before);
    expect(decoded!.iat).toBeLessThanOrEqual(after);
    expect(decoded!.exp).toBeGreaterThanOrEqual(before + 120);
    expect(decoded!.exp).toBeLessThanOrEqual(after + 120);
  });
});

// ── Expired tokens ─────────────────────────────────────────

describe("expired token", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for an expired token", () => {
    // Sign a token that already expired (0 seconds TTL, but we need to
    // manipulate time to get past the expiry check)
    const now = Math.floor(Date.now() / 1000);
    // Mock Date.now to return time in the past during signing
    const pastTime = (now - 600) * 1000; // 10 minutes ago
    vi.spyOn(Date, "now").mockReturnValue(pastTime);

    const token = signJwt({ userId: "expired_user" }, TEST_SECRET, 60);

    // Restore real time — token signed 10 min ago with 60s expiry is now expired
    vi.restoreAllMocks();

    const decoded = verifyJwt(token, TEST_SECRET);
    expect(decoded).toBeNull();
  });
});

// ── Tampered signature ─────────────────────────────────────

describe("tampered signature", () => {
  it("returns null when the signature is modified", () => {
    const token = signJwt({ userId: "user_1" }, TEST_SECRET, 300);
    const parts = token.split(".");

    // Tamper with the last character of the signature
    const tampered = parts[2].slice(0, -1) + (parts[2].endsWith("A") ? "B" : "A");
    const tamperedToken = `${parts[0]}.${parts[1]}.${tampered}`;

    expect(verifyJwt(tamperedToken, TEST_SECRET)).toBeNull();
  });

  it("returns null when the payload is modified after signing", () => {
    const token = signJwt({ userId: "user_1" }, TEST_SECRET, 300);
    const parts = token.split(".");

    // Replace payload with a different one
    const fakePayload = Buffer.from(
      JSON.stringify({ userId: "admin", exp: Math.floor(Date.now() / 1000) + 9999 }),
    ).toString("base64url");
    const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;

    expect(verifyJwt(tamperedToken, TEST_SECRET)).toBeNull();
  });
});

// ── Wrong secret ───────────────────────────────────────────

describe("wrong secret", () => {
  it("returns null when verified with a different secret", () => {
    const token = signJwt({ userId: "user_1" }, TEST_SECRET, 300);
    expect(verifyJwt(token, "wrong-secret")).toBeNull();
  });

  it("returns null when verified with an empty secret", () => {
    const token = signJwt({ userId: "user_1" }, TEST_SECRET, 300);
    expect(verifyJwt(token, "")).toBeNull();
  });
});

// ── Malformed tokens ───────────────────────────────────────

describe("malformed tokens", () => {
  it("returns null for a completely invalid string", () => {
    expect(verifyJwt("not-a-jwt", TEST_SECRET)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(verifyJwt("", TEST_SECRET)).toBeNull();
  });

  it("returns null for a token with only two parts", () => {
    expect(verifyJwt("header.body", TEST_SECRET)).toBeNull();
  });

  it("returns null for a token with four parts", () => {
    expect(verifyJwt("a.b.c.d", TEST_SECRET)).toBeNull();
  });

  it("returns null for a token with invalid base64url payload", () => {
    const token = signJwt({ x: 1 }, TEST_SECRET, 300);
    const parts = token.split(".");
    // Replace payload with non-JSON content but keep valid signature structure
    // This will fail at JSON.parse and should return null
    const badToken = `${parts[0]}.!!!invalid!!!.${parts[2]}`;
    expect(verifyJwt(badToken, TEST_SECRET)).toBeNull();
  });
});

// ── Type parameter ─────────────────────────────────────────

describe("type parameter", () => {
  it("casts the return type to the specified generic", () => {
    interface MfaChallenge {
      userId: string;
      nonceHash: string;
      ipHash: string;
    }

    const payload: MfaChallenge = {
      userId: "u_1",
      nonceHash: "abc123",
      ipHash: "def456",
    };

    const token = signJwt(payload, TEST_SECRET, 300);
    const decoded = verifyJwt<MfaChallenge & { iat: number; exp: number }>(
      token,
      TEST_SECRET,
    );

    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("u_1");
    expect(decoded!.nonceHash).toBe("abc123");
    expect(decoded!.ipHash).toBe("def456");
    expect(typeof decoded!.iat).toBe("number");
    expect(typeof decoded!.exp).toBe("number");
  });
});
