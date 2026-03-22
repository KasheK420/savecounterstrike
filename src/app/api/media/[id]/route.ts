import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.userId;
  const isAdmin = session?.user?.role === "ADMIN";

  const media = await db.media.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          steamId: true,
          ownsCs2: true,
          cs2PlaytimeHours: true,
          cs2Kills: true,
          cs2Deaths: true,
          cs2Wins: true,
          cs2HeadshotPct: true,
          faceitLevel: true,
          faceitElo: true,
          profileVisibility: true,
        },
      },
      _count: { select: { comments: true, votes: true } },
      ...(userId
        ? {
            votes: {
              where: { userId },
              select: { value: true },
            },
          }
        : {}),
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Non-admin can't see hidden/rejected media
  if (!isAdmin && media.status !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...media,
    userVote: media.votes?.[0]?.value ?? 0,
    votes: undefined,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!["APPROVED", "REJECTED", "HIDDEN"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const media = await db.media.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(media);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.userId;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await db.media.findUnique({ where: { id } });

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAdmin && media.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
