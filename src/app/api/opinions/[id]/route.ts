import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi, requireModeratorApi } from "@/lib/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const opinion = await db.opinion.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          ownsCs2: true,
          cs2PlaytimeHours: true,
          cs2Wins: true,
          faceitLevel: true,
          profileVisibility: true,
        },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!opinion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(opinion);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireModeratorApi();
  if (result.error) return result.response;

  const { id } = await params;
  const body = await request.json();
  const status = body.status;

  if (!["APPROVED", "REJECTED", "HIDDEN"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be APPROVED, REJECTED, or HIDDEN" },
      { status: 400 }
    );
  }

  const opinion = await db.opinion.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(opinion);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireModeratorApi();
  if (result.error) return result.response;

  const { id } = await params;
  await db.opinion.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
