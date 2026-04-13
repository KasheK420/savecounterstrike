/**
 * @fileoverview Reset password endpoint.
 *
 * Accepts a token (from email link) and a new password. Validates the token,
 * checks password strength and breach status, then updates the user's
 * password and invalidates all existing sessions via security stamp rotation.
 *
 * @route POST /api/auth/reset-password
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/auth-validation";
import { validateOrigin } from "@/lib/csrf";
import { db } from "@/lib/db";
import {
  checkBreachedPassword,
  hashPassword,
  validatePasswordStrength,
} from "@/lib/password";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";

/**
 * POST /api/auth/reset-password
 *
 * Rate limited to 5 requests per hour per IP. Consumes a one-time reset
 * token and sets a new password for the associated account.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit: 5 per hour per IP
    const rl = rateLimitByIp(request, "auth:reset-password", 5, 3600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 2. Validate origin (CSRF protection)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const { token, newPassword } = parsed.data;

    // 4. Hash the token and look up in the database
    const tokenHash = hashToken(token);
    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // 5. Validate: token exists, not expired, not already used
    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 },
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired" },
        { status: 400 },
      );
    }

    // 6. Validate password strength
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { error: "Password too weak", details: strength.errors },
        { status: 400 },
      );
    }

    // 7. Check if password has been breached (HIBP)
    const breached = await checkBreachedPassword(newPassword);
    if (breached) {
      return NextResponse.json(
        { error: "This password has appeared in a data breach. Please choose a different one." },
        { status: 400 },
      );
    }

    // 8. Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // 9. Transaction: update password, rotate security stamp, mark token used,
    //    and invalidate all other reset tokens for this user.
    await db.$transaction([
      // Update password and regenerate security stamp
      db.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          securityStamp: crypto.randomUUID(),
        },
      }),
      // Mark this token as used
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all other unused reset tokens for this user
      db.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
