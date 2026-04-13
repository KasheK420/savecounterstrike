import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateOrigin, requireValidOrigin } from "../csrf";

/** Helper to build a Request with a given origin header */
function makeRequest(origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request("https://example.com/api/test", { headers });
}

// ── validateOrigin ────────────────────────────────────────────

describe("validateOrigin", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
  });

  it("returns true when origin matches site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(validateOrigin(makeRequest("https://savecounterstrike.com"))).toBe(
      true,
    );
  });

  it("returns false when origin does not match", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(validateOrigin(makeRequest("https://evil.com"))).toBe(false);
  });

  it("returns false when origin header is missing", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(validateOrigin(makeRequest())).toBe(false);
  });

  it("defaults to localhost:3000 in dev (no env var)", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(validateOrigin(makeRequest("http://localhost:3000"))).toBe(true);
  });

  it("rejects wrong port on localhost", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(validateOrigin(makeRequest("http://localhost:4000"))).toBe(false);
  });

  it("strips path from site URL when comparing", () => {
    process.env.NEXT_PUBLIC_SITE_URL =
      "https://savecounterstrike.com/some/path";
    expect(validateOrigin(makeRequest("https://savecounterstrike.com"))).toBe(
      true,
    );
  });

  it("returns false for malformed site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";
    expect(validateOrigin(makeRequest("not-a-url"))).toBe(false);
  });
});

// ── requireValidOrigin ────────────────────────────────────────

describe("requireValidOrigin", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
  });

  it("does not throw for valid origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(() =>
      requireValidOrigin(makeRequest("https://savecounterstrike.com")),
    ).not.toThrow();
  });

  it("throws 'Invalid origin' for wrong origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(() => requireValidOrigin(makeRequest("https://evil.com"))).toThrow(
      "Invalid origin",
    );
  });

  it("throws when origin header is missing", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://savecounterstrike.com";
    expect(() => requireValidOrigin(makeRequest())).toThrow("Invalid origin");
  });
});
