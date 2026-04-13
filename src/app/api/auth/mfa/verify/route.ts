/**
 * @fileoverview MFA verification endpoint.
 *
 * Verifies a TOTP code or recovery code after the user completes
 * email/password (or Steam) login on an MFA-enabled account.
 * The login route issues a short-lived challenge JWT that binds
 * the verification attempt to the user, client IP, and a nonce cookie.
 *
 * @route POST /api/auth/mfa/verify
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { mfaVerifySchema, mfaRecoverySchema } from "@/lib/auth-validation";
import { verifyTotp, decryptSecret, verifyRecoveryCode } from "@/lib/mfa";
import { hashToken } from "@/lib/tokens";
import { validateOrigin } from "@/lib/csrf";
import {
  rateLimitByIp,
  rateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit";
import { verifyJwt } from "@/lib/jwt";
import { timingSafeCompare } from "@/lib/timing";

/** Shape of the MFA challenge JWT payload created by the login route. */
interface MfaChallengePayload {
  userId: string;
  nonceHash: string;
  ipHash: string;
}

/**
 * POST /api/auth/mfa/verify
 *
 * 1.  Rate limit (5 per 5 min per IP)
 * 2.  Validate origin (CSRF)
 * 3.  Parse body — try TOTP schema first, fall back to recovery schema
 * 4.  Verify challenge JWT
 * 5.  Validate binding (nonce cookie + IP)
 * 6.  Fetch user with MFA fields
 * 7.  Verify TOTP code OR recovery code
 * 8.  Log login attempt
 * 9.  Delete nonce cookie
 * 10. Create session via signIn
 * 11. Return 200
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Rate limit: 5 attempts per 5 minutes per IP ─────────
    const rl = rateLimitByIp(request, "auth:mfa-verify", 5, 5 * 60 * 1000);
    if (rl.limited) return rateLimitResponse(rl);

    // ── 2. CSRF: validate origin header ────────────────────────
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 3. Parse and validate request body ─────────────────────
    const body = await request.json();

    // Try TOTP (6-digit code) first, then recovery (16 hex chars)
    let challengeToken: string;
    let code: string;
    let isRecoveryCode = false;

    const totpResult = mfaVerifySchema.safeParse(body);
    if (totpResult.success) {
      challengeToken = totpResult.data.challengeToken;
      code = totpResult.data.code;
    } else {
      const recoveryResult = mfaRecoverySchema.safeParse(body);
      if (recoveryResult.success) {
        challengeToken = recoveryResult.data.challengeToken;
        code = recoveryResult.data.code;
        isRecoveryCode = true;
      } else {
        return NextResponse.json(
          { error: "Invalid request. Provide a 6-digit TOTP code or 16-character recovery code." },
          { status: 400 },
        );
      }
    }

    // ── 4. Verify challenge JWT ────────────────────────────────
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error("AUTH_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const payload = verifyJwt<MfaChallengePayload>(challengeToken, secret);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired challenge. Please log in again." },
        { status: 401 },
      );
    }

    const { userId, nonceHash, ipHash } = payload;

    // ── 5. Validate binding (nonce cookie + IP) ────────────────
    const cookieStore = await cookies();
    const nonceCookie = cookieStore.get("mfa_challenge_nonce")?.value;

    if (!nonceCookie || !timingSafeCompare(hashToken(nonceCookie), nonceHash)) {
      return NextResponse.json(
        { error: "Invalid challenge binding. Please log in again." },
        { status: 401 },
      );
    }

    const clientIpHash = hashToken(getClientIp(request));
    if (!timingSafeCompare(clientIpHash, ipHash)) {
      return NextResponse.json(
        { error: "Challenge binding mismatch. Please log in again." },
        { status: 401 },
      );
    }

    // ── 6. Fetch user with MFA fields ──────────────────────────
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaEnabled: true,
        mfaSecret: true,
        lastTotpStep: true,
        isBanned: true,
      },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: "Invalid challenge. Please log in again." },
        { status: 401 },
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "Account is suspended." },
        { status: 403 },
      );
    }

    // ── 7. Verify code ─────────────────────────────────────────
    let verified = false;

    if (!isRecoveryCode) {
      // 7a. TOTP verification
      const plaintextSecret = decryptSecret(user.mfaSecret);
      const result = verifyTotp(plaintextSecret, code, user.lastTotpStep);

      if (result.valid && result.step !== null) {
        // Update lastTotpStep for replay protection
        await db.user.update({
          where: { id: userId },
          data: { lastTotpStep: result.step },
        });
        verified = true;
      }
    } else {
      // 7b. Recovery code verification
      const unusedCodes = await db.mfaRecoveryCode.findMany({
        where: { userId, usedAt: null },
      });

      for (const codeRow of unusedCodes) {
        const match = await verifyRecoveryCode(code, codeRow.codeHash);
        if (match) {
          await db.mfaRecoveryCode.update({
            where: { id: codeRow.id },
            data: { usedAt: new Date() },
          });
          verified = true;
          break;
        }
      }
    }

    // ── 8. Log login attempt ───────────────────────────────────
    await db.loginAttempt.create({
      data: {
        userId,
        ipHash: clientIpHash,
        userAgent: request.headers.get("user-agent") || null,
        success: verified,
        method: "MFA",
      },
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 401 },
      );
    }

    // ── 9. Delete nonce cookie ─────────────────────────────────
    const response = NextResponse.json({ success: true });
    response.cookies.delete("mfa_challenge_nonce");

    // ── 10. Create session via signIn ──────────────────────────
    await signIn("email-password", {
      userId,
      mfaVerified: "true",
      redirect: false,
    });

    // ── 11. Return 200 ────────────────────────────────────────
    return response;
  } catch (error) {
    console.error("MFA verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
