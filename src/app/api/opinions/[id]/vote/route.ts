import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getVoteIpHash } from "@/lib/vote-hash";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = rateLimitByIp(request, "vote:opinion", 30, 60_000);
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
    const opinion = await tx.opinion.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!opinion) throw new Error("NOT_FOUND");

    const isOwnContent = userId ? opinion.authorId === userId : false;

    // Find existing vote — by userId (authenticated) or ipHash (anonymous)
    let existing;
    if (userId) {
      existing = await tx.opinionVote.findUnique({
        where: { opinionId_userId: { opinionId: id, userId } },
      });
    } else {
      existing = await tx.opinionVote.findFirst({
        where: { opinionId: id, ipHash },
      });
    }

    let karmaChange = 0;

    if (value === 0 || (existing && existing.value === value)) {
      if (existing) {
        await tx.opinionVote.delete({ where: { id: existing.id } });
        await tx.opinion.update({
          where: { id },
          data: { score: { decrement: existing.value } },
        });
        karmaChange = -existing.value;
      }
    } else if (existing) {
      await tx.opinionVote.update({
        where: { id: existing.id },
        data: { value },
      });
      await tx.opinion.update({
        where: { id },
        data: { score: { increment: value * 2 } },
      });
      karmaChange = value * 2;
    } else {
      await tx.opinionVote.create({
        data: {
          opinionId: id,
          userId,
          ipHash,
          value,
        },
      });
      await tx.opinion.update({
        where: { id },
        data: { score: { increment: value } },
      });
      karmaChange = value;
    }

    // Karma only applies when voter is authenticated and content isn't their own
    if (karmaChange !== 0 && userId && !isOwnContent) {
      await tx.user.update({
        where: { id: opinion.authorId },
        data: { karma: { increment: karmaChange } },
      }).catch(() => {});
    }

    const updated = await tx.opinion.findUnique({
      where: { id },
      select: { score: true },
    });
    return updated?.score ?? 0;
  });

  return NextResponse.json({ score });
}
