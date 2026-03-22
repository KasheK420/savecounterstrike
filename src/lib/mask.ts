/**
 * @fileoverview Server-side privacy masking utilities.
 *
 * Masks user identifiers for display in public contexts (signatures, leaderboards).
 * These functions MUST only be called on the server — never import from "use client" files.
 *
 * @module mask
 */

/**
 * Mask display name for privacy: show first 2 chars + asterisks.
 *
 * @param name - Original display name
 * @returns Masked name (e.g., "Lukas" → "Lu******")
 */
export function maskDisplayName(name: string): string {
  if (!name) return "****";
  if (name.length <= 2) return name + "****";
  // Show first 2 chars, mask rest (capped at 8 asterisks)
  return name.slice(0, 2) + "*".repeat(Math.min(name.length - 2, 8));
}

/**
 * Mask Steam64 ID for privacy: show first 4 + **** + last 4.
 *
 * @param steamId - Steam64 ID (17 digits)
 * @returns Masked ID (e.g., "76561198012345678" → "7656****5678")
 */
export function maskSteamId(steamId: string): string {
  if (!steamId || steamId.length <= 8) return "****";
  return steamId.slice(0, 4) + "****" + steamId.slice(-4);
}
