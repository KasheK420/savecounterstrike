const FACEIT_API_BASE = "https://open.faceit.com/data/v4";

export interface FaceitStats {
  level: number;
  elo: number;
  nickname: string;
}

/**
 * Fetch FACEIT CS2 stats for a player by their Steam64 ID.
 * Returns null if the player has no FACEIT account or the API fails.
 */
export async function fetchFaceitStats(
  steamId: string
): Promise<FaceitStats | null> {
  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey) return null;

  const url = `${FACEIT_API_BASE}/players?game=cs2&game_player_id=${steamId}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  // 404 = player doesn't have a FACEIT account
  if (!res.ok) return null;

  const data = await res.json();

  const cs2Data = data?.games?.cs2;
  if (!cs2Data) return null;

  return {
    level: cs2Data.skill_level ?? null,
    elo: cs2Data.faceit_elo ?? null,
    nickname: data.nickname ?? null,
  };
}
