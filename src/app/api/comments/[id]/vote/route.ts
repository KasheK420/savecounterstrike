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

  // Get comment author for karma
  const comment = await db.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isOwnContent = comment.authorId === userId;

  const existing = await db.commentVote.findUnique({
    where: { commentId_userId: { commentId: id, userId } },
  });

  let karmaChange = 0;

  if (existing) {
    if (existing.value === value || value === 0) {
      await db.commentVote.delete({ where: { id: existing.id } });
      await db.comment.update({
        where: { id },
        data: { score: { decrement: existing.value } },
      });
      karmaChange = -existing.value;
    } else {
      await db.commentVote.update({
        where: { id: existing.id },
        data: { value },
      });
      await db.comment.update({
        where: { id },
        data: { score: { increment: value * 2 } },
      });
      karmaChange = value * 2;
    }
  } else if (value !== 0) {
    await db.commentVote.create({
      data: { commentId: id, userId, value },
    });
    await db.comment.update({
      where: { id },
      data: { score: { increment: value } },
    });
    karmaChange = value;
  }

  // Update author karma (not for self-votes)
  if (karmaChange !== 0 && !isOwnContent) {
    await db.user.update({
      where: { id: comment.authorId },
      data: { karma: { increment: karmaChange } },
    }).catch(() => {});
  }

  const updated = await db.comment.findUnique({ where: { id } });
  return NextResponse.json({ score: updated?.score || 0 });
}
