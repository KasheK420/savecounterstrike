import { db } from "@/lib/db";

const AUTO_HIDE_THRESHOLD = -5;

export async function checkAutoModeration(mediaId: string) {
  const media = await db.media.findUnique({
    where: { id: mediaId },
    select: { score: true, status: true },
  });

  if (!media) return;

  // Auto-hide when score drops to threshold
  if (media.score <= AUTO_HIDE_THRESHOLD && media.status === "APPROVED") {
    await db.media.update({
      where: { id: mediaId },
      data: { status: "HIDDEN" },
    });
    return;
  }

  // Auto-restore when score goes back above threshold (only if auto-hidden, not manually rejected)
  if (media.score > AUTO_HIDE_THRESHOLD && media.status === "HIDDEN") {
    await db.media.update({
      where: { id: mediaId },
      data: { status: "APPROVED" },
    });
  }
}

export async function recalculateMediaScore(mediaId: string): Promise<number> {
  const result = await db.mediaVote.aggregate({
    where: { mediaId },
    _sum: { value: true },
  });

  const score = result._sum.value ?? 0;

  await db.media.update({
    where: { id: mediaId },
    data: { score },
  });

  return score;
}

export async function recalculateCommentScore(commentId: string): Promise<number> {
  const result = await db.commentVote.aggregate({
    where: { commentId },
    _sum: { value: true },
  });

  const score = result._sum.value ?? 0;

  await db.comment.update({
    where: { id: commentId },
    data: { score },
  });

  return score;
}
