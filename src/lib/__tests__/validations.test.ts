import { describe, it, expect } from "vitest";
import {
  petitionSignSchema,
  mediaSubmitSchema,
  commentSchema,
  contactSchema,
  supporterRegisterSchema,
  articleSchema,
} from "../validations";

// ── petitionSignSchema ─────────────────────────────────────────

describe("petitionSignSchema", () => {
  it("accepts a valid message", () => {
    const result = petitionSignSchema.safeParse({ message: "I support this!" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("I support this!");
    }
  });

  it("accepts empty object (no message)", () => {
    const result = petitionSignSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBeUndefined();
    }
  });

  it("trims whitespace from message", () => {
    const result = petitionSignSchema.safeParse({ message: "  trimmed  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("trimmed");
    }
  });

  it("rejects message exceeding 500 characters", () => {
    const result = petitionSignSchema.safeParse({ message: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("transforms empty string message to undefined", () => {
    const result = petitionSignSchema.safeParse({ message: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBeUndefined();
    }
  });
});

// ── mediaSubmitSchema ──────────────────────────────────────────

describe("mediaSubmitSchema", () => {
  it("accepts a valid YouTube URL with title", () => {
    const result = mediaSubmitSchema.safeParse({
      url: "https://www.youtube.com/watch?v=abc",
      title: "Test Video",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a URL from a disallowed host", () => {
    const result = mediaSubmitSchema.safeParse({
      url: "https://evil.com/video",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-https URLs", () => {
    const result = mediaSubmitSchema.safeParse({
      url: "http://youtube.com/watch",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title shorter than 3 characters", () => {
    const result = mediaSubmitSchema.safeParse({
      url: "https://youtube.com/watch",
      title: "ab",
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["https://www.youtube.com/watch?v=xyz", "youtube.com"],
    ["https://x.com/user/status/123", "x.com"],
    ["https://twitter.com/user/status/123", "twitter.com"],
    ["https://www.instagram.com/p/abc", "instagram.com"],
    ["https://www.tiktok.com/@user/video/123", "tiktok.com"],
    ["https://www.twitch.tv/clip/abc", "twitch.tv"],
  ])("accepts URL from %s", (url) => {
    const result = mediaSubmitSchema.safeParse({
      url,
      title: "Valid Title",
    });
    expect(result.success).toBe(true);
  });
});

// ── commentSchema ──────────────────────────────────────────────

describe("commentSchema", () => {
  it("accepts comment with opinionId", () => {
    const result = commentSchema.safeParse({
      content: "Great post!",
      opinionId: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts comment with mediaId", () => {
    const result = commentSchema.safeParse({
      content: "Nice clip!",
      mediaId: "def456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects comment with both opinionId and mediaId", () => {
    const result = commentSchema.safeParse({
      content: "Both!",
      opinionId: "abc",
      mediaId: "def",
    });
    expect(result.success).toBe(false);
  });

  it("rejects comment with neither opinionId nor mediaId", () => {
    const result = commentSchema.safeParse({
      content: "Neither!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = commentSchema.safeParse({
      content: "",
      opinionId: "abc",
    });
    expect(result.success).toBe(false);
  });
});

// ── contactSchema ──────────────────────────────────────────────

describe("contactSchema", () => {
  it("accepts a valid contact form submission", () => {
    const result = contactSchema.safeParse({
      name: "John",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = contactSchema.safeParse({
      name: "John",
      subject: "Hello",
      message: "This is a test message.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = contactSchema.safeParse({
      name: "John",
      email: "not-an-email",
      subject: "Hello",
      message: "This is a test message.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = contactSchema.safeParse({
      name: "J",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message shorter than 10 characters", () => {
    const result = contactSchema.safeParse({
      name: "John",
      email: "john@example.com",
      subject: "Hello",
      message: "Short",
    });
    expect(result.success).toBe(false);
  });
});

// ── supporterRegisterSchema ────────────────────────────────────

describe("supporterRegisterSchema", () => {
  it("accepts a valid supporter registration", () => {
    const result = supporterRegisterSchema.safeParse({
      discordId: "123456",
      steamId: "76561198012345678",
      displayName: "Player",
      tier: "Gold",
      tierLevel: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects steamId that is not 17 digits", () => {
    const result = supporterRegisterSchema.safeParse({
      discordId: "123456",
      steamId: "12345",
      displayName: "Player",
      tier: "Gold",
      tierLevel: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects tierLevel greater than 10", () => {
    const result = supporterRegisterSchema.safeParse({
      discordId: "123456",
      steamId: "76561198012345678",
      displayName: "Player",
      tier: "Gold",
      tierLevel: 11,
    });
    expect(result.success).toBe(false);
  });

  it("rejects tierLevel less than 1", () => {
    const result = supporterRegisterSchema.safeParse({
      discordId: "123456",
      steamId: "76561198012345678",
      displayName: "Player",
      tier: "Gold",
      tierLevel: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ── articleSchema ──────────────────────────────────────────────

describe("articleSchema", () => {
  it("accepts a valid article", () => {
    const result = articleSchema.safeParse({
      title: "Test Article",
      slug: "test-article",
      content: "Content here.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects slug with uppercase or spaces", () => {
    const result = articleSchema.safeParse({
      title: "Test Article",
      slug: "Test Article",
      content: "Content here.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with double hyphens", () => {
    const result = articleSchema.safeParse({
      title: "Test Article",
      slug: "test--article",
      content: "Content here.",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid hyphenated slug", () => {
    const result = articleSchema.safeParse({
      title: "My First Post",
      slug: "my-first-post",
      content: "Content here.",
    });
    expect(result.success).toBe(true);
  });
});
