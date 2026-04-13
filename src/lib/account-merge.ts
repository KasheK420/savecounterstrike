/**
 * @fileoverview Account merge logic for combining two user accounts.
 *
 * Transfers all relations (opinions, comments, votes, media, signatures,
 * page views, login attempts) from the merge user to the keep user,
 * copies missing identity data, sums karma, and deletes the merged account.
 *
 * All operations run inside a single Prisma transaction to ensure atomicity.
 *
 * @module account-merge
 * @see {@link docs/superpowers/specs/2026-04-14-auth-system-design.md|Auth System Design, Section 3.4}
 */

import crypto from "crypto";
import { db } from "./db";

/**
 * Merge two user accounts, keeping one and absorbing the other.
 *
 * Pre-checks enforce that the merge user is not banned and does not
 * hold an elevated role above the keep user (which would require
 * admin approval).
 *
 * @param keepUserId  - ID of the user to keep (the currently authenticated user)
 * @param mergeUserId - ID of the user to absorb and delete
 * @throws {Error} If merge user is banned or holds a higher role
 */
export async function mergeAccounts(
  keepUserId: string,
  mergeUserId: string,
): Promise<void> {
  // ── Pre-checks ─────────────────────────────────────────────
  const [keepUser, mergeUser] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: keepUserId } }),
    db.user.findUniqueOrThrow({ where: { id: mergeUserId } }),
  ]);

  if (mergeUser.isBanned) {
    throw new Error("Cannot merge banned account");
  }

  if (
    (mergeUser.role === "ADMIN" || mergeUser.role === "MODERATOR") &&
    keepUser.role === "USER"
  ) {
    throw new Error("Cannot absorb elevated role");
  }

  // ── Atomic Transaction ─────────────────────────────────────
  await db.$transaction(async (tx) => {
    // 1. Transfer PetitionSignature
    const keepSig = await tx.petitionSignature.findUnique({
      where: { userId: keepUserId },
    });
    if (!keepSig) {
      await tx.petitionSignature
        .updateMany({
          where: { userId: mergeUserId },
          data: { userId: keepUserId },
        })
        .catch(() => {});
    } else {
      await tx.petitionSignature.deleteMany({
        where: { userId: mergeUserId },
      });
    }

    // 2. Transfer Opinions
    await tx.opinion.updateMany({
      where: { authorId: mergeUserId },
      data: { authorId: keepUserId },
    });

    // 3. Transfer Comments
    await tx.comment.updateMany({
      where: { authorId: mergeUserId },
      data: { authorId: keepUserId },
    });

    // 4. Transfer Media
    await tx.media.updateMany({
      where: { authorId: mergeUserId },
      data: { authorId: keepUserId },
    });

    // 5. Transfer votes (delete conflicts first, then move remaining)
    // OpinionVotes
    const keepOpinionVoteIds = (
      await tx.opinionVote.findMany({
        where: { userId: keepUserId },
        select: { opinionId: true },
      })
    ).map((v) => v.opinionId);
    await tx.opinionVote.deleteMany({
      where: { userId: mergeUserId, opinionId: { in: keepOpinionVoteIds } },
    });
    await tx.opinionVote.updateMany({
      where: { userId: mergeUserId },
      data: { userId: keepUserId },
    });

    // CommentVotes
    const keepCommentVoteIds = (
      await tx.commentVote.findMany({
        where: { userId: keepUserId },
        select: { commentId: true },
      })
    ).map((v) => v.commentId);
    await tx.commentVote.deleteMany({
      where: { userId: mergeUserId, commentId: { in: keepCommentVoteIds } },
    });
    await tx.commentVote.updateMany({
      where: { userId: mergeUserId },
      data: { userId: keepUserId },
    });

    // MediaVotes
    const keepMediaVoteIds = (
      await tx.mediaVote.findMany({
        where: { userId: keepUserId },
        select: { mediaId: true },
      })
    ).map((v) => v.mediaId);
    await tx.mediaVote.deleteMany({
      where: { userId: mergeUserId, mediaId: { in: keepMediaVoteIds } },
    });
    await tx.mediaVote.updateMany({
      where: { userId: mergeUserId },
      data: { userId: keepUserId },
    });

    // 6. Transfer PageViews
    await tx.pageView.updateMany({
      where: { userId: mergeUserId },
      data: { userId: keepUserId },
    });

    // 7. Transfer LoginAttempts
    await tx.loginAttempt.updateMany({
      where: { userId: mergeUserId },
      data: { userId: keepUserId },
    });

    // 8. Copy missing identity data to keepUser
    const updateData: Record<string, unknown> = {};

    if (!keepUser.steamId && mergeUser.steamId) {
      updateData.steamId = mergeUser.steamId;
    }
    if (!keepUser.email && mergeUser.email) {
      updateData.email = mergeUser.email;
      updateData.passwordHash = mergeUser.passwordHash;
      updateData.emailVerified = mergeUser.emailVerified;
      updateData.emailVerifiedAt = mergeUser.emailVerifiedAt;
    }

    // Copy stats if keepUser doesn't have them
    if (keepUser.ownsCs2 == null && mergeUser.ownsCs2 != null) {
      updateData.ownsCs2 = mergeUser.ownsCs2;
    }
    if (keepUser.cs2PlaytimeHours == null && mergeUser.cs2PlaytimeHours != null) {
      updateData.cs2PlaytimeHours = mergeUser.cs2PlaytimeHours;
    }
    if (keepUser.cs2Kills == null && mergeUser.cs2Kills != null) {
      updateData.cs2Kills = mergeUser.cs2Kills;
    }
    if (keepUser.cs2Deaths == null && mergeUser.cs2Deaths != null) {
      updateData.cs2Deaths = mergeUser.cs2Deaths;
    }
    if (keepUser.cs2Wins == null && mergeUser.cs2Wins != null) {
      updateData.cs2Wins = mergeUser.cs2Wins;
    }
    if (keepUser.cs2HeadshotPct == null && mergeUser.cs2HeadshotPct != null) {
      updateData.cs2HeadshotPct = mergeUser.cs2HeadshotPct;
    }

    // Karma: sum both accounts
    updateData.karma = keepUser.karma + mergeUser.karma;

    // Regenerate security stamp to invalidate all sessions
    updateData.securityStamp = crypto.randomUUID();

    if (Object.keys(updateData).length > 0) {
      await tx.user.update({
        where: { id: keepUserId },
        data: updateData,
      });
    }

    // 9. Delete merge tokens and recovery codes
    await tx.passwordResetToken.deleteMany({ where: { userId: mergeUserId } });
    await tx.emailVerifyToken.deleteMany({ where: { userId: mergeUserId } });
    await tx.mfaRecoveryCode.deleteMany({ where: { userId: mergeUserId } });

    // 10. Delete merged user (remaining cascades handle orphans)
    await tx.user.delete({ where: { id: mergeUserId } });

    // 11. Audit log
    await tx.auditLog.create({
      data: {
        userId: keepUserId,
        action: "account_merge",
        details: {
          mergedUserId: mergeUserId,
          mergedSteamId: mergeUser.steamId,
          mergedEmail: mergeUser.email,
        },
      },
    });
  });
}
