import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { faceitLevel, faceitElo } = body;

  if (
    typeof faceitLevel !== "number" ||
    typeof faceitElo !== "number" ||
    faceitLevel < 1 ||
    faceitLevel > 10
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await db.user.update({
    where: { steamId: session.user.steamId },
    data: { faceitLevel, faceitElo },
  });

  return NextResponse.json({ ok: true });
}
