import { describe, it, expect } from "vitest";
import { timingSafeCompare } from "../timing";

describe("timingSafeCompare", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeCompare("secret123", "secret123")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeCompare("secret123", "wrong456")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeCompare("short", "muchlongerstring")).toBe(false);
  });

  it("returns false for empty vs non-empty", () => {
    expect(timingSafeCompare("", "notempty")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(timingSafeCompare("", "")).toBe(true);
  });

  it("handles unicode correctly", () => {
    expect(timingSafeCompare("héllo", "héllo")).toBe(true);
    expect(timingSafeCompare("héllo", "hello")).toBe(false);
  });

  it("correctly compares Bearer token format", () => {
    const secret = "my-super-secret-token";
    const validHeader = `Bearer ${secret}`;
    const invalidHeader = "Bearer wrong-token";

    expect(timingSafeCompare(validHeader, `Bearer ${secret}`)).toBe(true);
    expect(timingSafeCompare(invalidHeader, `Bearer ${secret}`)).toBe(false);
  });
});
