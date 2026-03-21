const FACEIT_API_BASE = "https://open.faceit.com/data/v4";

export interface FaceitStats {
  level: number;
  elo: number;
  nickname: string;
}

/**
 * Fetch FACEIT CS2 stats for a player by their Steam64 ID.
 * Returns null if the player has no FACEIT account, API fails,
 * or Cloudflare blocks the request.
 */
export async function fetchFaceitStats(
  steamId: string
): Promise<FaceitStats | null> {
  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey) return null;

  const url = `${FACEIT_API_BASE}/players?game=cs2&game_player_id=${steamId}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "SaveCounterStrike/1.0",
      },
    });

    // Cloudflare challenge or rate limit
    if (res.status === 403 || res.status === 429) {
      console.warn(
        `[FACEIT] Blocked (${res.status}) — likely Cloudflare challenge`
      );
      return null;
    }

    // 404 = player doesn't have a FACEIT account
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn("[FACEIT] Non-JSON response — Cloudflare challenge page");
      return null;
    }

    const data = await res.json();

    const cs2Data = data?.games?.cs2;
    if (!cs2Data) return null;

    return {
      level: cs2Data.skill_level ?? null,
      elo: cs2Data.faceit_elo ?? null,
      nickname: data.nickname ?? null,
    };
  } catch (err) {
    console.warn("[FACEIT] Fetch failed:", (err as Error).message);
    return null;
  }
}
