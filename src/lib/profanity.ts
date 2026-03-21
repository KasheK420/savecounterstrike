import { PROFANITY_WORDS } from "./profanity-words";

/**
 * Escape special regex characters in a string.
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
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);

  return new RegExp(`\\b(${sorted.join("|")})\\b`, "gi");
})();

/**
 * Replace profane words with ❤️.
 * Returns the original string if no profanity is found.
 */
export function filterProfanity(text: string): string {
  return text.replace(profanityRegex, "❤️");
}

/**
 * Check whether text contains any profane words.
 */
export function containsProfanity(text: string): boolean {
  profanityRegex.lastIndex = 0;
  return profanityRegex.test(text);
}
