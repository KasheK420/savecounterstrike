import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchFaceitStats } from "@/lib/faceit";

export async function POST() {
  const session = await auth();
  const steamId = session?.user?.steamId;
  if (!steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Server-side verification — fetch directly from FACEIT API
  const stats = await fetchFaceitStats(steamId);

  if (!stats) {
    return NextResponse.json(
      { error: "Could not fetch FACEIT stats. You may not have a FACEIT account or the API is temporarily unavailable." },
      { status: 404 }
    );
  }

  await db.user.update({
    where: { steamId },
    data: {
      faceitLevel: stats.level,
      faceitElo: stats.elo,
    },
  });

  return NextResponse.json({ ok: true, level: stats.level, elo: stats.elo });
}
