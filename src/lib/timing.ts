/**
 * @fileoverview Timing-safe string comparison.
 *
 * Prevents timing side-channel attacks on secret comparisons
 * by using Node.js crypto.timingSafeEqual under the hood.
 *
 * @module timing
 */

import { timingSafeEqual } from "crypto";

/**
 * Compare two strings in constant time.
 * Prevents timing attacks that exploit early-exit in === comparison.
 *
 * @param a - First string (e.g., user-provided value)
 * @param b - Second string (e.g., stored secret)
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  return timingSafeEqual(bufA, bufB);
}
