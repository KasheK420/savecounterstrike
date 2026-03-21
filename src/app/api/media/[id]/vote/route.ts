import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { recalculateMediaScore, checkAutoModeration } from "@/lib/moderation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const value = body.value === 1 ? 1 : body.value === -1 ? -1 : 0;

  const media = await db.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await db.mediaVote.findUnique({
    where: { mediaId_userId: { mediaId: id, userId } },
  });

  if (existing) {
    if (existing.value === value || value === 0) {
      // Toggle off — remove vote
      await db.mediaVote.delete({ where: { id: existing.id } });
    } else {
      // Change vote direction
      await db.mediaVote.update({
        where: { id: existing.id },
        data: { value },
      });
    }
  } else if (value !== 0) {
    await db.mediaVote.create({
      data: { mediaId: id, userId, value },
    });
  }

  const score = await recalculateMediaScore(id);
  await checkAutoModeration(id);

  return NextResponse.json({ score });
}
