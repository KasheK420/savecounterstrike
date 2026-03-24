import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { searchParams } = request.nextUrl;
  const filter = searchParams.get("filter"); // banned, flagged, all
  const source = searchParams.get("source"); // signer, manual, leaderboard
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const where: Record<string, unknown> = {};
  if (filter === "banned") where.vacBanned = true;
  if (filter === "flagged") where.flagged = true;
  if (source) where.source = source;

  const [players, total] = await Promise.all([
    db.trackedPlayer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.trackedPlayer.count({ where }),
  ]);

  return NextResponse.json({ players, total, page, limit });
}
