/**
 * @fileoverview Change password endpoint (authenticated).
 *
 * Allows a logged-in user to change their password by providing the current
 * password and a new one. Validates strength, checks HIBP, and rotates the
 * security stamp to invalidate all other sessions.
 *
 * @route POST /api/auth/change-password
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/auth-validation";
import { validateOrigin } from "@/lib/csrf";
import { db } from "@/lib/db";
import {
  checkBreachedPassword,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/password";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/auth/change-password
 *
 * Authenticated endpoint. Rate limited to 5 requests per hour per user ID.
 * Verifies the current password before accepting a new one.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Require authenticated session
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.userId;

    // 2. Rate limit: 5 per hour per userId
    const rl = rateLimit(`auth:change-password:${userId}`, 5, 3600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 3. Validate origin (CSRF protection)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // 5. Fetch user with password hash
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Password change is not available for this account" },
        { status: 400 },
      );
    }

    // 6. Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    // 7. Validate new password strength
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { error: "Password too weak", details: strength.errors },
        { status: 400 },
      );
    }

    // 8. Check if new password has been breached (HIBP)
    const breached = await checkBreachedPassword(newPassword);
    if (breached) {
      return NextResponse.json(
        { error: "This password has appeared in a data breach. Please choose a different one." },
        { status: 400 },
      );
    }

    // 9. Hash new password and update with rotated security stamp
    const passwordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        securityStamp: crypto.randomUUID(),
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
