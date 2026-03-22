/**
 * Server-side privacy masking utilities.
 * These functions MUST only be called on the server — never import from "use client" files.
 */

/** "Lukas" → "Lu******" — first 2 chars + asterisks (capped at 8) */
export function maskDisplayName(name: string): string {
  if (!name) return "****";
  if (name.length <= 2) return name + "****";
  return name.slice(0, 2) + "*".repeat(Math.min(name.length - 2, 8));
}

/** "76561198012345678" → "7656****5678" — first 4 + last 4 */
export function maskSteamId(steamId: string): string {
  if (!steamId || steamId.length <= 8) return "****";
  return steamId.slice(0, 4) + "****" + steamId.slice(-4);
}
