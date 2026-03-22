import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 votes per minute per IP
  const rl = rateLimitByIp(request, "vote:opinion", 30, 60_000);
  if (rl.limited) return rateLimitResponse(rl);

  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const value = body.value === 1 ? 1 : body.value === -1 ? -1 : 0;

  // Get opinion to know author (for karma)
  const opinion = await db.opinion.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!opinion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isOwnContent = opinion.authorId === userId;

  const existing = await db.opinionVote.findUnique({
    where: { opinionId_userId: { opinionId: id, userId } },
  });

  let karmaChange = 0;

  if (value === 0 || (existing && existing.value === value)) {
    // Remove vote (explicit 0 or toggle off)
    if (existing) {
      await db.opinionVote.delete({ where: { id: existing.id } });
      await db.opinion.update({
        where: { id },
        data: { score: { decrement: existing.value } },
      });
      karmaChange = -existing.value; // Reverse karma
    }
  } else if (existing) {
    // Change vote direction
    await db.opinionVote.update({
      where: { id: existing.id },
      data: { value },
    });
    await db.opinion.update({
      where: { id },
      data: { score: { increment: value * 2 } },
    });
    karmaChange = value * 2; // Reverse old + add new
  } else {
    // New vote
    await db.opinionVote.create({
      data: { opinionId: id, userId, value },
    });
    await db.opinion.update({
      where: { id },
      data: { score: { increment: value } },
    });
    karmaChange = value;
  }

  // Update author karma (don't give karma for self-votes)
  if (karmaChange !== 0 && !isOwnContent) {
    await db.user.update({
      where: { id: opinion.authorId },
      data: { karma: { increment: karmaChange } },
    }).catch(() => {}); // Non-fatal
  }

  const updated = await db.opinion.findUnique({ where: { id } });
  return NextResponse.json({ score: updated?.score || 0 });
}
