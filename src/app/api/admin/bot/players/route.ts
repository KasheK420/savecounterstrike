import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const filter = searchParams.get("filter"); // banned, flagged, all
  const source = searchParams.get("source"); // signer, manual, leaderboard
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const where: any = {};
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
