import { describe, it, expect } from "vitest";
import { sanitizeContent, stripHtml } from "../sanitize";

describe("sanitizeContent", () => {
  it("removes script tags", () => {
    const result = sanitizeContent('<script>alert("xss")</script><p>Hello</p>');
    expect(result).toBe("<p>Hello</p>");
  });

  it("preserves allowed tags", () => {
    const tags = [
      { input: "<p>text</p>", expected: "<p>text</p>" },
      { input: "<strong>bold</strong>", expected: "<strong>bold</strong>" },
      { input: "<em>italic</em>", expected: "<em>italic</em>" },
      { input: "<ul><li>item</li></ul>", expected: "<ul><li>item</li></ul>" },
      { input: "<ol><li>item</li></ol>", expected: "<ol><li>item</li></ol>" },
      { input: "<h1>heading</h1>", expected: "<h1>heading</h1>" },
      { input: "<h2>heading</h2>", expected: "<h2>heading</h2>" },
      { input: "<h3>heading</h3>", expected: "<h3>heading</h3>" },
    ];

    for (const { input, expected } of tags) {
      expect(sanitizeContent(input)).toBe(expected);
    }
  });

  it("strips javascript: URLs from href", () => {
    const result = sanitizeContent('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("strips data: URLs from src", () => {
    const result = sanitizeContent('<img src="data:image/png;base64,abc123">');
    expect(result).not.toContain("data:");
  });

  it("adds target and rel attributes to links", () => {
    const result = sanitizeContent('<a href="https://example.com">link</a>');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("strips on* event handlers", () => {
    const result = sanitizeContent('<p onclick="alert(1)">text</p>');
    expect(result).not.toContain("onclick");
    expect(result).toBe("<p>text</p>");
  });

  it("removes iframe tags", () => {
    const result = sanitizeContent('<iframe src="https://evil.com"></iframe><p>safe</p>');
    expect(result).not.toContain("iframe");
    expect(result).toContain("<p>safe</p>");
  });

  it("preserves img with https src", () => {
    const result = sanitizeContent('<img src="https://example.com/img.jpg">');
    expect(result).toContain("https://example.com/img.jpg");
    expect(result).toContain("<img");
  });
});

describe("stripHtml", () => {
  it("strips all HTML to plain text", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("strips script tags and their content", () => {
    expect(stripHtml("<script>bad</script>Hello")).toBe("Hello");
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });
});
