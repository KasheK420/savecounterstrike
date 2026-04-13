import { describe, it, expect } from "vitest";
import { filterProfanity, containsProfanity } from "../profanity";

describe("filterProfanity", () => {
  it("passes clean text through unchanged", () => {
    expect(filterProfanity("Hello world")).toBe("Hello world");
  });

  it("replaces a profane word with heart emoji", () => {
    const result = filterProfanity("This is shit");
    expect(result).not.toContain("shit");
    expect(result).toContain("\u2764\uFE0F");
    expect(result).toBe("This is \u2764\uFE0F");
  });

  it("replaces profanity case-insensitively", () => {
    const result = filterProfanity("FUCK this");
    expect(result).not.toContain("FUCK");
    expect(result).toContain("\u2764\uFE0F");
  });

  it("replaces multiple profane words", () => {
    const result = filterProfanity("shit and fuck");
    expect(result).not.toContain("shit");
    expect(result).not.toContain("fuck");
    expect(result).toBe("\u2764\uFE0F and \u2764\uFE0F");
  });

  it("preserves non-profane parts of the sentence", () => {
    const result = filterProfanity("What the fuck is going on");
    expect(result).toContain("What the");
    expect(result).toContain("is going on");
    expect(result).not.toContain("fuck");
  });

  it("returns empty string for empty input", () => {
    expect(filterProfanity("")).toBe("");
  });
});

describe("containsProfanity", () => {
  it("returns false for clean text", () => {
    expect(containsProfanity("Hello world")).toBe(false);
  });

  it("returns true for profane text", () => {
    expect(containsProfanity("This is shit")).toBe(true);
  });

  it("detects profanity case-insensitively", () => {
    expect(containsProfanity("DAMN it")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(containsProfanity("")).toBe(false);
  });
});
