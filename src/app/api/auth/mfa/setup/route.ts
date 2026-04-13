/**
 * @fileoverview MFA setup endpoint (authenticated).
 *
 * Generates a TOTP secret, QR code, and recovery codes for the user.
 * The secret is stored as a pending value until confirmed via the
 * /api/auth/mfa/confirm endpoint within 10 minutes.
 *
 * @route POST /api/auth/mfa/setup
 */

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { db } from "@/lib/db";
import {
  generateTotpSecret,
  encryptSecret,
  generateRecoveryCodes,
} from "@/lib/mfa";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/auth/mfa/setup
 *
 * Authenticated endpoint. Requires verified email or Steam identity.
 * Rate limited to 5 requests per hour per user ID.
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
    const rl = rateLimit(`auth:mfa-setup:${userId}`, 5, 3_600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 3. Validate origin (CSRF protection)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Fetch user — must have verified email or Steam identity
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        steamId: true,
        displayName: true,
        mfaEnabled: true,
        isBanned: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Reject banned users
    if (user.isBanned) {
      return NextResponse.json(
        { error: "Account is banned" },
        { status: 403 },
      );
    }

    // Must have either verified email or Steam identity to enable MFA
    const hasVerifiedEmail = user.email && user.emailVerified;
    const hasSteam = !!user.steamId;
    if (!hasVerifiedEmail && !hasSteam) {
      return NextResponse.json(
        { error: "Email verification or Steam account required to enable MFA" },
        { status: 400 },
      );
    }

    // 5. Check if MFA already enabled
    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA already enabled" },
        { status: 400 },
      );
    }

    // 6. Generate TOTP secret
    const accountLabel = user.email || user.displayName;
    const { secret, otpauthUri } = generateTotpSecret(
      "SaveCounterStrike",
      accountLabel,
    );

    // 7. Generate QR code data URL
    const qrCode = await QRCode.toDataURL(otpauthUri);

    // 8. Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);

    // 9. Encrypt secret and bundle with recovery codes for the confirm step
    const encryptedSecret = encryptSecret(secret);
    const pendingData = JSON.stringify({
      encryptedSecret,
      recoveryCodes,
    });

    // 10. Store pending MFA data with 10 minute TTL
    await db.user.update({
      where: { id: userId },
      data: {
        pendingMfaSecret: pendingData,
        pendingMfaExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // 11. Return setup data — recovery codes shown ONCE
    return NextResponse.json({
      otpauthUri,
      qrCode,
      recoveryCodes,
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
