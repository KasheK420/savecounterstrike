/**
 * @fileoverview HTML sanitization utilities for user-generated content.
 *
 * Uses sanitize-html to strip dangerous tags/attributes and prevent XSS attacks.
 * All user content (opinions, comments, articles) must pass through sanitizeContent()
 * before storage or rendering.
 *
 * @module sanitize
 * @see {@link https://github.com/apostrophecms/sanitize-html|sanitize-html}
 */

import sanitizeHtml from "sanitize-html";

// ── Configuration ───────────────────────────────────────────

/** Allowed HTML tags for rich content (TipTap editor output) */
const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "strong", "em", "u",
  "ul", "ol", "li", "a", "img", "blockquote",
  "br", "code", "pre", "hr",
];

/** Allowed attributes per tag (security-focused whitelist) */
const ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
};

// ── Main Functions ─────────────────────────────────────────

/**
 * Sanitize HTML content for safe rendering.
 * Removes all tags/attributes not in the whitelist, forces external links to open
 * in new tabs with security attributes.
 *
 * @param html - Raw HTML string (potentially from TipTap editor or external source)
 * @returns Sanitized HTML safe for SSR and client rendering
 *
 * @example
 * sanitizeContent('<script>alert("xss")</script><p>Hello</p>')
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ["http", "https", "mailto"], // Block javascript:, data:, etc.
    allowedSchemesAppliedToAttributes: ["href", "src", "cite"],
    transformTags: {
      // Force all links to open in new tab with security attributes
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer", // Security best practice for target="_blank"
        },
      }),
    },
  });
}

/**
 * Strip all HTML tags, leaving only plain text.
 * Used for excerpts, search indexing, and plain text previews.
 *
 * @param html - HTML string to process
 * @returns Plain text with all tags removed
 *
 * @example
 * stripHtml('<p>Hello <strong>world</strong></p>')
 * // Returns: 'Hello world'
 */
export function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim();
}
