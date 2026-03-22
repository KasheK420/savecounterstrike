import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkAutoModeration } from "@/lib/moderation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = rateLimitByIp(request, "vote:media", 30, 60_000);
  if (rl.limited) return rateLimitResponse(rl);

  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const value = body.value === 1 ? 1 : body.value === -1 ? -1 : 0;

  const score = await db.$transaction(async (tx) => {
    const media = await tx.media.findUnique({ where: { id } });
    if (!media) throw new Error("NOT_FOUND");

    const existing = await tx.mediaVote.findUnique({
      where: { mediaId_userId: { mediaId: id, userId } },
    });

    if (existing) {
      if (existing.value === value || value === 0) {
        await tx.mediaVote.delete({ where: { id: existing.id } });
      } else {
        await tx.mediaVote.update({
          where: { id: existing.id },
          data: { value },
        });
      }
    } else if (value !== 0) {
      await tx.mediaVote.create({
        data: { mediaId: id, userId, value },
      });
    }

    // Recalculate score atomically
    const result = await tx.mediaVote.aggregate({
      where: { mediaId: id },
      _sum: { value: true },
    });
    const newScore = result._sum.value ?? 0;

    await tx.media.update({
      where: { id },
      data: { score: newScore },
    });

    return newScore;
  });

  await checkAutoModeration(id);

  return NextResponse.json({ score });
}
