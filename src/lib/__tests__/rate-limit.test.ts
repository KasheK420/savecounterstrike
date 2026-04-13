import { describe, it, expect } from "vitest";
import { getClientIp } from "../rate-limit";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://example.com", {
    headers: new Headers(headers),
  });
}

describe("getClientIp", () => {
  it("returns cf-connecting-ip when cf-ray is present", () => {
    const req = makeRequest({
      "cf-connecting-ip": "1.2.3.4",
      "cf-ray": "abc123-LAX",
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("ignores cf-connecting-ip when cf-ray is absent (spoofed header)", () => {
    const req = makeRequest({
      "cf-connecting-ip": "1.2.3.4",
      "x-forwarded-for": "10.0.0.1, 192.168.1.1",
    });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("falls back to rightmost x-forwarded-for", () => {
    const req = makeRequest({
      "x-forwarded-for": "client-spoofed, 10.0.0.1, 192.168.1.1",
    });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("falls back to x-real-ip", () => {
    const req = makeRequest({
      "x-real-ip": "10.0.0.5",
    });
    expect(getClientIp(req)).toBe("10.0.0.5");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBe("unknown");
  });
});
