import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const STEAM_API_BASE = "https://api.steampowered.com";
const CS2_APP_ID = 730;

async function getCurrentPlayers(): Promise<number> {
  try {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) return 0;
    const url = `${STEAM_API_BASE}/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${CS2_APP_ID}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.response?.player_count ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const [
    currentPlayers,
    totalSignatures,
    communityStats,
    faceitDistribution,
    trackedStats,
    banWaves,
    banHistory,
    leaderboard,
  ] = await Promise.all([
    getCurrentPlayers(),

    db.petitionSignature.count(),

    db.user.aggregate({
      _avg: { cs2PlaytimeHours: true },
      _sum: { cs2PlaytimeHours: true },
      _count: { id: true },
      where: { ownsCs2: true },
    }),

    db.user.groupBy({
      by: ["faceitLevel"],
      _count: { id: true },
      where: { faceitLevel: { not: null, gt: 0 } },
      orderBy: { faceitLevel: "asc" },
    }),

    db.trackedPlayer.aggregate({
      _count: { id: true },
      where: {},
    }).then(async (total) => {
      const vacBanned = await db.trackedPlayer.count({
        where: { vacBanned: true },
      });
      const gameBanned = await db.trackedPlayer.count({
        where: { numberOfGameBans: { gt: 0 } },
      });
      return {
        totalTracked: total._count.id,
        totalVacBanned: vacBanned,
        totalGameBanned: gameBanned,
      };
    }),

    db.banWave.findMany({
      orderBy: { date: "desc" },
      take: 20,
    }),

    db.banSnapshot.findMany({
      orderBy: { date: "asc" },
      take: 90,
    }),

    db.trackedPlayer.findMany({
      where: { premierRating: { not: null } },
      orderBy: { premierRating: "desc" },
      take: 50,
      select: {
        steamId: true,
        displayName: true,
        avatarUrl: true,
        premierRating: true,
        competitiveRank: true,
        wins: true,
        vacBanned: true,
        numberOfVacBans: true,
        numberOfGameBans: true,
        daysSinceLastBan: true,
      },
    }),
  ]);

  return NextResponse.json({
    currentPlayers,
    totalSignatures,
    community: {
      totalWithCs2: communityStats._count.id,
      averagePlaytimeHours: Math.round(communityStats._avg.cs2PlaytimeHours ?? 0),
      totalPlaytimeHours: communityStats._sum.cs2PlaytimeHours ?? 0,
    },
    faceitDistribution: faceitDistribution.map((f) => ({
      level: f.faceitLevel,
      count: f._count.id,
    })),
    tracked: trackedStats,
    banWaves,
    banHistory,
    leaderboard,
  });
}
