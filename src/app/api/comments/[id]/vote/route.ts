import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const score = await db.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!comment) throw new Error("NOT_FOUND");

    const isOwnContent = comment.authorId === userId;
    const existing = await tx.commentVote.findUnique({
      where: { commentId_userId: { commentId: id, userId } },
    });

    let karmaChange = 0;

    if (existing) {
      if (existing.value === value || value === 0) {
        await tx.commentVote.delete({ where: { id: existing.id } });
        await tx.comment.update({
          where: { id },
          data: { score: { decrement: existing.value } },
        });
        karmaChange = -existing.value;
      } else {
        await tx.commentVote.update({
          where: { id: existing.id },
          data: { value },
        });
        await tx.comment.update({
          where: { id },
          data: { score: { increment: value * 2 } },
        });
        karmaChange = value * 2;
      }
    } else if (value !== 0) {
      await tx.commentVote.create({
        data: { commentId: id, userId, value },
      });
      await tx.comment.update({
        where: { id },
        data: { score: { increment: value } },
      });
      karmaChange = value;
    }

    if (karmaChange !== 0 && !isOwnContent) {
      await tx.user.update({
        where: { id: comment.authorId },
        data: { karma: { increment: karmaChange } },
      }).catch(() => {});
    }

    const updated = await tx.comment.findUnique({
      where: { id },
      select: { score: true },
    });
    return updated?.score ?? 0;
  });

  return NextResponse.json({ score });
}
