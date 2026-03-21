const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_BASE = "https://api.steampowered.com";

export interface SteamProfile {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

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

  if (!text.includes("is_valid:true")) {
    return null;
  }

  const claimedId = params.get("openid.claimed_id");
  if (!claimedId) return null;

  const match = claimedId.match(/\/id\/(\d+)$/);
  return match ? match[1] : null;
}

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

// Steam ID format conversions
export function steamId64ToSteamId(steamId64: string): string {
  const id = BigInt(steamId64);
  const universe = Number((id >> 56n) & 0xFFn);
  const authServer = Number(id & 1n);
  const accountNumber = Number((id >> 1n) & 0x7FFFFFFFn);
  return `STEAM_${universe}:${authServer}:${accountNumber}`;
}

export function steamId64ToSteamId3(steamId64: string): string {
  const id = BigInt(steamId64);
  const accountId = Number(id & 0xFFFFFFFFn);
  return `[U:1:${accountId}]`;
}
