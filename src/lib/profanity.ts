/**
 * @fileoverview Profanity filtering with multilingual support.
 *
 * Uses a pre-compiled regex from 300+ words across 15+ languages.
 * Words are sorted longest-first to prioritize longer matches.
 * Replaces profanity with ❤️ emoji rather than blocking content entirely.
 *
 * @module profanity
 */

import { PROFANITY_WORDS } from "./profanity-words";

// ── Regex Construction ──────────────────────────────────────

/**
 * Escape special regex characters in a string.
 * Prevents regex injection from word list entries.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a single compiled regex from the word list.
 * Words are sorted longest-first so "motherfucker" matches before "fuck".
 */
const profanityRegex: RegExp = (() => {
  const sorted = [...new Set(PROFANITY_WORDS)]
    .sort((a, b) => b.length - a.length) // Longest first for correct matching priority
    .map(escapeRegex);

  // \b = word boundary, "gi" = global + case-insensitive
  return new RegExp(`\\b(${sorted.join("|")})\\b`, "gi");
})();

// ── Public Functions ────────────────────────────────────────

/**
 * Replace profane words with ❤️ emoji.
 * Returns the original string if no profanity is found.
 *
 * @param text - Text to filter
 * @returns Filtered text with profanity replaced
 */
export function filterProfanity(text: string): string {
  return text.replace(profanityRegex, "❤️");
}

/**
 * Check whether text contains any profane words.
 * Useful for validation before accepting content.
 *
 * @param text - Text to check
 * @returns true if profanity detected
 */
export function containsProfanity(text: string): boolean {
  profanityRegex.lastIndex = 0; // Reset regex state
  return profanityRegex.test(text);
}
