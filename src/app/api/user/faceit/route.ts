import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchFaceitStats } from "@/lib/faceit";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import { requireActiveUserApi } from "@/lib/admin";

export async function POST(request: NextRequest) {
  // Rate limit: 3 FACEIT syncs per 10 minutes per IP
  const rl = rateLimitByIp(request, "faceit:sync", 3, 600_000);
  if (rl.limited) return rateLimitResponse(rl);

  const userCheck = await requireActiveUserApi();
  if (userCheck.error) return userCheck.response;
  const steamId = userCheck.session.user?.steamId;
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
