import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      bio: true,
      karma: true,
      customName: true,
      hidePlaytime: true,
      hideFaceit: true,
      ownsCs2: true,
      cs2PlaytimeHours: true,
      cs2Wins: true,
      cs2HeadshotPct: true,
      faceitLevel: true,
      faceitElo: true,
      profileVisibility: true,
      petitionSignature: {
        select: { createdAt: true, message: true },
      },
      opinions: {
        where: { status: "APPROVED" },
        orderBy: { score: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          score: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      },
      _count: {
        select: { opinions: true, comments: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (id !== userId) {
    return NextResponse.json(
      { error: "You can only edit your own profile" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const data: Record<string, any> = {};

  if (typeof body.bio === "string") {
    const { filterProfanity } = await import("@/lib/profanity");
    data.bio = filterProfanity(body.bio.trim().slice(0, 500)) || null;
  }
  if (typeof body.customName === "string") {
    const { filterProfanity } = await import("@/lib/profanity");
    const name = body.customName.trim().slice(0, 32);
    data.customName = name ? filterProfanity(name) : null;
  }
  if (typeof body.hidePlaytime === "boolean") {
    data.hidePlaytime = body.hidePlaytime;
  }
  if (typeof body.hideFaceit === "boolean") {
    data.hideFaceit = body.hideFaceit;
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      bio: true,
      customName: true,
      hidePlaytime: true,
      hideFaceit: true,
    },
  });

  return NextResponse.json(updated);
}
