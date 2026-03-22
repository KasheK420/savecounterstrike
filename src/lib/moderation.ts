/**
 * @fileoverview Automatic content moderation based on community voting.
 *
 * Implements score-based auto-moderation: content that falls below a negative
 * threshold is automatically hidden; content that recovers is restored.
 * Also provides vote aggregation functions to recalculate scores.
 *
 * @module moderation
 */

import { db } from "@/lib/db";

// ── Configuration ───────────────────────────────────────────

/**
 * Score threshold for auto-hiding content.
 * Content with score <= -5 is automatically hidden from public view.
 */
const AUTO_HIDE_THRESHOLD = -5;

// ── Auto-Moderation ─────────────────────────────────────────

/**
 * Check if media should be auto-hidden or restored based on current score.
 * Called after each vote to maintain content quality.
 *
 * Auto-hide triggers when score <= -5 (if currently APPROVED)
 * Auto-restore triggers when score > -5 (if currently HIDDEN)
 * Note: REJECTED content is never auto-restored (manual review required)
 *
 * @param mediaId - Media item to check
 */
export async function checkAutoModeration(mediaId: string) {
  const media = await db.media.findUnique({
    where: { id: mediaId },
    select: { score: true, status: true },
  });

  if (!media) return;

  // Auto-hide when score drops to/below threshold
  if (media.score <= AUTO_HIDE_THRESHOLD && media.status === "APPROVED") {
    await db.media.update({
      where: { id: mediaId },
      data: { status: "HIDDEN" },
    });
    return;
  }

  // Auto-restore when score recovers above threshold
  // Only affects HIDDEN content (auto-hidden), not REJECTED (manual action)
  if (media.score > AUTO_HIDE_THRESHOLD && media.status === "HIDDEN") {
    await db.media.update({
      where: { id: mediaId },
      data: { status: "APPROVED" },
    });
  }
}

// ── Score Recalculation ────────────────────────────────────

/**
 * Recalculate media score from all votes.
 * Useful for data consistency checks or after bulk operations.
 *
 * @param mediaId - Media item to recalculate
 * @returns Updated score
 */
export async function recalculateMediaScore(mediaId: string): Promise<number> {
  // Aggregate all votes (+1 upvotes, -1 downvotes)
  const result = await db.mediaVote.aggregate({
    where: { mediaId },
    _sum: { value: true },
  });

  const score = result._sum.value ?? 0;

  // Persist recalculated score
  await db.media.update({
    where: { id: mediaId },
    data: { score },
  });

  return score;
}

/**
 * Recalculate comment score from all votes.
 *
 * @param commentId - Comment to recalculate
 * @returns Updated score
 */
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
