/**
 * @fileoverview MFA compliance middleware.
 *
 * Checks whether a session satisfies MFA requirements:
 * - Admin/moderator accounts must have MFA set up.
 * - Any account with MFA enabled must have passed MFA verification
 *   in the current session.
 *
 * @module mfa-gate
 */

import { db } from "./db";

/**
 * Check whether the current session is MFA-compliant.
 *
 * @param session - The NextAuth session object
 * @returns `{ compliant: true }` if no action needed, or
 *          `{ compliant: false, redirect }` with the path to redirect to
 */
export async function checkMfaCompliance(
  session: { user?: { userId?: string; mfaVerified?: boolean } } | null,
): Promise<{ compliant: boolean; redirect?: string }> {
  if (!session?.user?.userId) return { compliant: true };

  const user = await db.user.findUnique({
    where: { id: session.user.userId },
    select: { role: true, mfaEnabled: true },
  });
  if (!user) return { compliant: true };

  // Admin/mod must have MFA set up
  if ((user.role === "ADMIN" || user.role === "MODERATOR") && !user.mfaEnabled) {
    return { compliant: false, redirect: "/auth/mfa/setup" };
  }

  // MFA enabled but session not MFA-verified
  if (user.mfaEnabled && !session.user.mfaVerified) {
    return { compliant: false, redirect: "/auth/mfa" };
  }

  return { compliant: true };
}
