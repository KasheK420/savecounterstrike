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

  if (value === 0) {
    // Remove vote
    const existing = await db.opinionVote.findUnique({
      where: { opinionId_userId: { opinionId: id, userId } },
    });
    if (existing) {
      await db.opinionVote.delete({
        where: { id: existing.id },
      });
      await db.opinion.update({
        where: { id },
        data: { score: { decrement: existing.value } },
      });
    }
    return NextResponse.json({ score: (await db.opinion.findUnique({ where: { id } }))?.score || 0 });
  }

  const existing = await db.opinionVote.findUnique({
    where: { opinionId_userId: { opinionId: id, userId } },
  });

  if (existing) {
    if (existing.value === value) {
      // Same vote — remove it (toggle off)
      await db.opinionVote.delete({ where: { id: existing.id } });
      await db.opinion.update({
        where: { id },
        data: { score: { decrement: value } },
      });
    } else {
      // Change vote direction
      await db.opinionVote.update({
        where: { id: existing.id },
        data: { value },
      });
      await db.opinion.update({
        where: { id },
        data: { score: { increment: value * 2 } }, // remove old + add new
      });
    }
  } else {
    // New vote
    await db.opinionVote.create({
      data: { opinionId: id, userId, value },
    });
    await db.opinion.update({
      where: { id },
      data: { score: { increment: value } },
    });
  }

  const updated = await db.opinion.findUnique({ where: { id } });
  return NextResponse.json({ score: updated?.score || 0 });
}
