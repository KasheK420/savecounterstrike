const STEAM_API_BASE = "https://api.steampowered.com";
const CS2_APP_ID = 730;

export interface CS2Stats {
  ownsCs2: boolean;
  playtimeHours: number | null;
  profileVisibility: "public" | "private";
  kills: number | null;
  deaths: number | null;
  wins: number | null;
  headshotPct: number | null;
}

/**
 * Fetch CS2 ownership, playtime, and game stats for a Steam user.
 * Combines GetOwnedGames + GetUserStatsForGame in parallel.
 */
export async function fetchCS2Stats(
  steamId: string,
  apiKey: string
): Promise<CS2Stats | null> {
  // Check profile visibility first
  const summaryUrl = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const summaryRes = await fetch(summaryUrl);
  if (!summaryRes.ok) return null;

  const summaryData = await summaryRes.json();
  const player = summaryData?.response?.players?.[0];
  if (!player) return null;

  const isPublic = player.communityvisibilitystate === 3;

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

  // Fetch owned games + game stats in parallel
  const gamesUrl =
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/` +
    `?key=${apiKey}&steamid=${steamId}&include_appinfo=false` +
    `&appids_filter[0]=${CS2_APP_ID}&format=json`;

  const statsUrl =
    `${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/` +
    `?appid=${CS2_APP_ID}&key=${apiKey}&steamid=${steamId}`;

  const [gamesRes, statsRes] = await Promise.all([
    fetch(gamesUrl),
    fetch(statsUrl).catch(() => null),
  ]);

  // Parse owned games
  let playtimeHours: number | null = null;
  let ownsCs2 = false;

  if (gamesRes.ok) {
    const gamesData = await gamesRes.json();
    const cs2 = gamesData?.response?.games?.find(
      (g: { appid: number }) => g.appid === CS2_APP_ID
    );
    if (cs2) {
      ownsCs2 = true;
      playtimeHours = Math.round(cs2.playtime_forever / 60);
    }
  }

  // Parse game stats
  let kills: number | null = null;
  let deaths: number | null = null;
  let wins: number | null = null;
  let headshotPct: number | null = null;

  if (statsRes && statsRes.ok) {
    const statsData = await statsRes.json();
    const statsList: { name: string; value: number }[] =
      statsData?.playerstats?.stats || [];

    const getStat = (name: string): number | null => {
      const found = statsList.find((s) => s.name === name);
      return found ? found.value : null;
    };

    kills = getStat("total_kills");
    deaths = getStat("total_deaths");
    wins = getStat("total_wins");
    const hsKills = getStat("total_kills_headshot");

    if (kills && hsKills) {
      headshotPct = Math.round((hsKills / kills) * 1000) / 10; // one decimal
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
