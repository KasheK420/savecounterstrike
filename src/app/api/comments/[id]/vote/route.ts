import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getVoteIpHash } from "@/lib/vote-hash";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = rateLimitByIp(request, "vote:comment", 30, 60_000);
  if (rl.limited) return rateLimitResponse(rl);

  const session = await auth();
  const userId = session?.user?.userId || null;
  const ipHash = !userId ? getVoteIpHash(request) : null;

  if (!userId && !ipHash) {
    return NextResponse.json({ error: "Cannot identify voter" }, { status: 400 });
  }

  const { id } = await params;
  const body = await request.json();
  const value = body.value === 1 ? 1 : body.value === -1 ? -1 : 0;

  const score = await db.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: { id },
      select: { authorId: true, opinionId: true, mediaId: true },
    });
    if (!comment) throw new Error("NOT_FOUND");

    // Verify parent content is approved before allowing votes
    if (comment.opinionId) {
      const opinion = await tx.opinion.findUnique({
        where: { id: comment.opinionId },
        select: { status: true },
      });
      if (!opinion || opinion.status !== "APPROVED") throw new Error("NOT_FOUND");
    } else if (comment.mediaId) {
      const media = await tx.media.findUnique({
        where: { id: comment.mediaId },
        select: { status: true },
      });
      if (!media || media.status !== "APPROVED") throw new Error("NOT_FOUND");
    }

    const isOwnContent = userId ? comment.authorId === userId : false;

    // Find existing vote — by userId (authenticated) or ipHash (anonymous)
    let existing;
    if (userId) {
      existing = await tx.commentVote.findUnique({
        where: { commentId_userId: { commentId: id, userId } },
      });
    } else {
      existing = await tx.commentVote.findFirst({
        where: { commentId: id, ipHash },
      });
    }

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
        data: {
          commentId: id,
          userId,
          ipHash,
          value,
        },
      });
      await tx.comment.update({
        where: { id },
        data: { score: { increment: value } },
      });
      karmaChange = value;
    }

    // Karma only applies when voter is authenticated and content isn't their own
    if (karmaChange !== 0 && userId && !isOwnContent) {
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
