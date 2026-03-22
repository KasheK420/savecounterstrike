/**
 * @fileoverview CS2 player statistics fetching from Steam Web API.
 *
 * Combines multiple Steam API endpoints to gather CS2 ownership, playtime,
 * and in-game statistics (kills, deaths, headshot percentage).
 *
 * @module steam-stats
 */

// ── Constants ───────────────────────────────────────────────

const STEAM_API_BASE = "https://api.steampowered.com";
const CS2_APP_ID = 730;

// ── Types ───────────────────────────────────────────────────

/** CS2 player statistics */
export interface CS2Stats {
  /** Whether the player owns CS2 */
  ownsCs2: boolean;
  /** Total playtime in hours (null if private or not owned) */
  playtimeHours: number | null;
  /** Profile visibility status */
  profileVisibility: "public" | "private";
  /** Total kills (null if stats unavailable) */
  kills: number | null;
  /** Total deaths (null if stats unavailable) */
  deaths: number | null;
  /** Total match wins (null if stats unavailable) */
  wins: number | null;
  /** Headshot percentage 0-100 with one decimal (null if stats unavailable) */
  headshotPct: number | null;
}

// ── Main Function ───────────────────────────────────────────

/**
 * Fetch CS2 ownership, playtime, and game stats for a Steam user.
 * Combines GetOwnedGames + GetUserStatsForGame in parallel.
 *
 * @param steamId - Steam64 ID of the player
 * @param apiKey - Steam Web API key
 * @returns CS2Stats object or null if profile not found
 */
export async function fetchCS2Stats(
  steamId: string,
  apiKey: string
): Promise<CS2Stats | null> {
  // ── Step 1: Check Profile Visibility ───────────────────────
  // Must check this first because private profiles block all other API calls
  const summaryUrl = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const summaryRes = await fetch(summaryUrl);
  if (!summaryRes.ok) return null;

  const summaryData = await summaryRes.json();
  const player = summaryData?.response?.players?.[0];
  if (!player) return null;

  // visibilitystate 3 = public, 1 = private
  const isPublic = player.communityvisibilitystate === 3;

  // Return early for private profiles (no access to games/stats)
  if (!isPublic) {
    return {
      ownsCs2: false,
      playtimeHours: null,
      profileVisibility: "private",
      kills: null,
      deaths: null,
      wins: null,
      headshotPct: null,
    };
  }

  // ── Step 2: Fetch Games and Stats (Parallel) ────────────────
  const gamesUrl =
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/` +
    `?key=${apiKey}&steamid=${steamId}&include_appinfo=false` +
    `&appids_filter[0]=${CS2_APP_ID}&format=json`;

  const statsUrl =
    `${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/` +
    `?appid=${CS2_APP_ID}&key=${apiKey}&steamid=${steamId}`;

  const [gamesRes, statsRes] = await Promise.all([
    fetch(gamesUrl),
    fetch(statsUrl).catch(() => null), // Stats may fail if user has stats disabled
  ]);

  // ── Step 3: Parse Owned Games ───────────────────────────────
  let playtimeHours: number | null = null;
  let ownsCs2 = false;

  if (gamesRes.ok) {
    const gamesData = await gamesRes.json();
    const cs2 = gamesData?.response?.games?.find(
      (g: { appid: number }) => g.appid === CS2_APP_ID
    );
    if (cs2) {
      ownsCs2 = true;
      // playtime_forever is in minutes, convert to hours
      playtimeHours = Math.round(cs2.playtime_forever / 60);
    }
  }

  // ── Step 4: Parse Game Statistics ───────────────────────────
  let kills: number | null = null;
  let deaths: number | null = null;
  let wins: number | null = null;
  let headshotPct: number | null = null;

  if (statsRes && statsRes.ok) {
    const statsData = await statsRes.json();
    const statsList: { name: string; value: number }[] =
      statsData?.playerstats?.stats || [];

    // Helper to extract a stat by name from the response array
    const getStat = (name: string): number | null => {
      const found = statsList.find((s) => s.name === name);
      return found ? found.value : null;
    };

    kills = getStat("total_kills");
    deaths = getStat("total_deaths");
    wins = getStat("total_wins");
    const hsKills = getStat("total_kills_headshot");

    // Calculate headshot percentage with one decimal precision
    if (kills && hsKills) {
      headshotPct = Math.round((hsKills / kills) * 1000) / 10;
    }
  }

  return {
    ownsCs2,
    playtimeHours,
    profileVisibility: "public",
    kills,
    deaths,
    wins,
    headshotPct,
  };
}
