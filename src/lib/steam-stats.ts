const STEAM_API_BASE = "https://api.steampowered.com";
const CS2_APP_ID = 730;

export interface CS2Stats {
  ownsCs2: boolean;
  playtimeHours: number | null;
  profileVisibility: "public" | "private";
}

/**
 * Fetch CS2 ownership and playtime for a Steam user.
 * Returns null if the API call fails entirely.
 * Returns ownsCs2: false with null playtime for private profiles.
 */
export async function fetchCS2Stats(
  steamId: string,
  apiKey: string
): Promise<CS2Stats | null> {
  // First check profile visibility via GetPlayerSummaries
  const summaryUrl = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const summaryRes = await fetch(summaryUrl);
  if (!summaryRes.ok) return null;

  const summaryData = await summaryRes.json();
  const player = summaryData?.response?.players?.[0];
  if (!player) return null;

  // communityvisibilitystate: 1 = private, 3 = public
  const isPublic = player.communityvisibilitystate === 3;

  if (!isPublic) {
    return {
      ownsCs2: false,
      playtimeHours: null,
      profileVisibility: "private",
    };
  }

  // Fetch owned games filtered to CS2 only
  const gamesUrl =
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/` +
    `?key=${apiKey}&steamid=${steamId}&include_appinfo=false` +
    `&appids_filter[0]=${CS2_APP_ID}&format=json`;

  const gamesRes = await fetch(gamesUrl);
  if (!gamesRes.ok) return null;

  const gamesData = await gamesRes.json();
  const games = gamesData?.response?.games;

  if (!games || games.length === 0) {
    return {
      ownsCs2: false,
      playtimeHours: null,
      profileVisibility: "public",
    };
  }

  const cs2 = games.find(
    (g: { appid: number }) => g.appid === CS2_APP_ID
  );

  if (!cs2) {
    return {
      ownsCs2: false,
      playtimeHours: null,
      profileVisibility: "public",
    };
  }

  return {
    ownsCs2: true,
    playtimeHours: Math.round(cs2.playtime_forever / 60),
    profileVisibility: "public",
  };
}
