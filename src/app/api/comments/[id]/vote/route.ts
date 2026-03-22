import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 votes per minute per IP
  const rl = rateLimitByIp(request, "vote:comment", 30, 60_000);
  if (rl.limited) return rateLimitResponse(rl);

  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const value = body.value === 1 ? 1 : body.value === -1 ? -1 : 0;

  const existing = await db.commentVote.findUnique({
    where: { commentId_userId: { commentId: id, userId } },
  });

  if (existing) {
    if (existing.value === value || value === 0) {
      await db.commentVote.delete({ where: { id: existing.id } });
      await db.comment.update({
        where: { id },
        data: { score: { decrement: existing.value } },
      });
    } else {
      await db.commentVote.update({
        where: { id: existing.id },
        data: { value },
      });
      await db.comment.update({
        where: { id },
        data: { score: { increment: value * 2 } },
      });
    }
  } else if (value !== 0) {
    await db.commentVote.create({
      data: { commentId: id, userId, value },
    });
    await db.comment.update({
      where: { id },
      data: { score: { increment: value } },
    });
  }

  const updated = await db.comment.findUnique({ where: { id } });
  return NextResponse.json({ score: updated?.score || 0 });
}
