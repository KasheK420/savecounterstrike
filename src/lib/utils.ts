/**
 * @fileoverview General utility functions for the application.
 *
 * Includes Tailwind class merging and content analysis helpers.
 *
 * @module utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with proper precedence handling.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 *
 * @param inputs - Class values (strings, arrays, objects, conditionals)
 * @returns Merged class string with conflicting classes resolved
 *
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4" (px-4 wins)
 * cn("btn", { "btn-active": isActive }) // "btn btn-active" or "btn"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Estimate reading time for HTML content.
 * Strips HTML tags, counts words, assumes 200 WPM reading speed.
 *
 * @param html - HTML string to analyze
 * @returns Estimated reading time in minutes (minimum 1)
 *
 * @example
 * estimateReadingTime("<p>This is a short article with ten words.</p>") // 1
 */
export function estimateReadingTime(html: string): number {
  // Strip HTML tags to get plain text
  const text = html.replace(/<[^>]*>/g, "");
  // Split by whitespace and count non-empty tokens
  const words = text.split(/\s+/).filter(Boolean).length;
  // Assume 200 words per minute reading speed, minimum 1 minute
  return Math.max(1, Math.ceil(words / 200));
}
