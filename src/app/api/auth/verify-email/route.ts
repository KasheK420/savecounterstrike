/**
 * @fileoverview Email verification endpoint.
 *
 * Handles the verification link clicked from the user's email.
 * Validates the token, marks the user's email as verified, and
 * redirects to the login page with a success indicator.
 *
 * @route GET /api/auth/verify-email?token=<raw>
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";

/**
 * GET /api/auth/verify-email
 *
 * 1. Read token from query params
 * 2. Hash token, find in DB (with user relation)
 * 3. Validate: exists, not expired, not used
 * 4. Transaction: mark user verified + mark token used
 * 5. Redirect to login with success indicator
 */
export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // 0. Rate limit: 10 per minute per IP
    const rl = rateLimitByIp(request, "auth:verify-email", 10, 60_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 1. Read token from query params
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(`${siteUrl}/auth/login?error=missing_token`);
    }

    // 2. Hash token and look up in DB
    const tokenHash = hashToken(token);
    const record = await db.emailVerifyToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // 3a. Token not found
    if (!record) {
      return NextResponse.redirect(`${siteUrl}/?error=invalid_token`);
    }

    // 3b. Token expired
    if (record.expiresAt < new Date()) {
      return NextResponse.redirect(`${siteUrl}/?error=token_expired`);
    }

    // 3c. Token already used
    if (record.usedAt) {
      return NextResponse.redirect(`${siteUrl}/?error=token_used`);
    }

    // 4. Transaction: verify email + consume token
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      db.emailVerifyToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // 5. Redirect to login with success
    return NextResponse.redirect(`${siteUrl}/auth/login?verified=true`);
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(`${siteUrl}/?error=verification_failed`);
  }
}
