/**
 * @fileoverview Steam OpenID authentication and API utilities.
 *
 * Handles Steam OpenID 2.0 authentication flow, Steam Web API integration,
 * and Steam ID format conversions.
 *
 * @module steam
 * @see {@link https://developer.valvesoftware.com/wiki/Steam_Web_API|Steam Web API Docs}
 */

// ── Constants ───────────────────────────────────────────────

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_BASE = "https://api.steampowered.com";

// ── Types ───────────────────────────────────────────────────

/** Steam player profile data */
export interface SteamProfile {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

// ── OpenID Authentication ───────────────────────────────────

/**
 * Generate Steam OpenID login URL.
 * Redirect user to this URL to initiate authentication.
 *
 * @param returnUrl - Full URL to redirect back to after auth (e.g., "https://site.com/api/auth/steam/callback")
 * @returns Complete Steam OpenID login URL
 */
export function getSteamLoginUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": new URL(returnUrl).origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

/**
 * Verify Steam OpenID authentication response.
 * Validates the signature with Steam's OpenID provider.
 *
 * @param params - URLSearchParams from the callback URL
 * @returns Steam64 ID if valid, null if verification failed
 */
export async function verifySteamLogin(
  params: URLSearchParams
): Promise<string | null> {
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  const text = await response.text();

  // Steam returns "is_valid:true" on successful verification
  if (!text.includes("is_valid:true")) {
    return null;
  }

  // Extract Steam64 ID from claimed_id (URL format: .../openid/id/{steam64})
  const claimedId = params.get("openid.claimed_id");
  if (!claimedId) return null;

  const match = claimedId.match(/\/id\/(\d+)$/);
  return match ? match[1] : null;
}

// ── Steam Web API ────────────────────────────────────────────

/**
 * Fetch player profile from Steam Web API.
 *
 * @param steamId - Steam64 ID
 * @returns Profile data or null if not found
 * @throws Error if STEAM_API_KEY environment variable is not set
 */
export async function fetchSteamProfile(
  steamId: string
): Promise<SteamProfile | null> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error("STEAM_API_KEY is not set");

  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const response = await fetch(url);
  const data = await response.json();

  const player = data?.response?.players?.[0];
  if (!player) return null;

  return {
    steamId: player.steamid,
    displayName: player.personaname,
    avatarUrl: player.avatarfull || player.avatar,
    profileUrl: player.profileurl,
  };
}

// ── Steam ID Format Conversions ────────────────────────────

/**
 * Convert Steam64 ID to legacy STEAM_X:Y:Z format.
 * Used for legacy systems and some third-party tools.
 *
 * @param steamId64 - Steam64 ID (e.g., "76561198012345678")
 * @returns Legacy Steam ID (e.g., "STEAM_0:0:12345")
 */
export function steamId64ToSteamId(steamId64: string): string {
  const id = BigInt(steamId64);
  const universe = Number((id >> 56n) & 0xFFn);
  const authServer = Number(id & 1n);
  const accountNumber = Number((id >> 1n) & 0x7FFFFFFFn);
  return `STEAM_${universe}:${authServer}:${accountNumber}`;
}

/**
 * Convert Steam64 ID to Steam3 format ([U:1:accountId]).
 * Used by Source engine games and some third-party services.
 *
 * @param steamId64 - Steam64 ID (e.g., "76561198012345678")
 * @returns Steam3 ID (e.g., "[U:1:123456]")
 */
export function steamId64ToSteamId3(steamId64: string): string {
  const id = BigInt(steamId64);
  const accountId = Number(id & 0xFFFFFFFFn);
  return `[U:1:${accountId}]`;
}
