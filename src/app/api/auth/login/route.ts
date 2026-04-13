/**
 * @fileoverview Email login endpoint.
 *
 * Authenticates users with email/password, enforces DB-backed account
 * lockout, email verification, and MFA challenge when enabled.
 *
 * @route POST /api/auth/login
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/auth-validation";
import { validateOrigin } from "@/lib/csrf";
import { verifyPassword } from "@/lib/password";
import { generateMfaChallengeNonce, hashToken } from "@/lib/tokens";
import { rateLimitByIp, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { signIn } from "@/lib/auth";
import { signJwt } from "@/lib/jwt";

/** Generic error message to prevent user enumeration */
const INVALID_CREDENTIALS = "Invalid email or password";

/** Dummy hash for constant-time comparison when user does not exist */
const DUMMY_HASH = "$2a$12$000000000000000000000uGWDEq2Kp3RVOfJzKMmVaEfLNLFbipm";

/** Lockout threshold: 5 failed attempts in 15 minutes */
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

/** MFA challenge JWT lifetime: 5 minutes */
const MFA_CHALLENGE_EXPIRY_SEC = 5 * 60;

/**
 * POST /api/auth/login
 *
 * 1. Rate limit (10/15min/IP)
 * 2. Validate origin (CSRF)
 * 3. Parse + validate body
 * 4. Find user (constant-time on miss)
 * 5. Check DB-backed lockout
 * 6. Check email verification
 * 7. Verify password
 * 8. Log attempt + handle MFA or create session
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit: 10 login attempts per 15 minutes per IP
    const rl = rateLimitByIp(request, "auth:login", 10, LOCKOUT_WINDOW_MS);
    if (rl.limited) return rateLimitResponse(rl);

    // 2. CSRF: validate origin header
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const clientIp = getClientIp(request);
    const ipHash = hashToken(clientIp);

    // 4. Find user by email — constant-time on miss to prevent enumeration
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        emailVerified: true,
        mfaEnabled: true,
        isBanned: true,
      },
    });

    if (!user) {
      // Do a fake bcrypt comparison to keep timing constant
      await verifyPassword(password, DUMMY_HASH);
      return NextResponse.json(
        { error: INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    // 4b. Ban check — fake bcrypt to keep timing constant, same error as not-found
    if (user.isBanned) {
      await verifyPassword(password, DUMMY_HASH);
      return NextResponse.json(
        { error: INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    // 5. Check DB-backed account lockout
    const fifteenMinAgo = new Date(Date.now() - LOCKOUT_WINDOW_MS);
    const failedAttempts = await db.loginAttempt.count({
      where: {
        userId: user.id,
        success: false,
        createdAt: { gte: fifteenMinAgo },
      },
    });

    if (failedAttempts >= LOCKOUT_THRESHOLD) {
      return NextResponse.json(
        { error: "Account temporarily locked. Please try again later." },
        { status: 429 },
      );
    }

    // 6. Check email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email first" },
        { status: 403 },
      );
    }

    // 7. Verify password
    const passwordValid = await verifyPassword(
      password,
      user.passwordHash || DUMMY_HASH,
    );

    if (!passwordValid) {
      // Log failed attempt
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          ipHash,
          userAgent: request.headers.get("user-agent") || null,
          success: false,
          method: "EMAIL",
        },
      });

      return NextResponse.json(
        { error: INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    // 8. MFA flow — do NOT log success yet; MFA verify will log its own
    if (user.mfaEnabled) {
      const authSecret = process.env.AUTH_SECRET;
      if (!authSecret) {
        console.error("AUTH_SECRET is not configured");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 },
        );
      }

      // Generate nonce for MFA challenge binding
      const nonce = generateMfaChallengeNonce();
      const nonceHash = hashToken(nonce);

      // Create challenge JWT bound to user, nonce, and IP
      const challengeToken = signJwt(
        { userId: user.id, nonceHash, ipHash },
        authSecret,
        MFA_CHALLENGE_EXPIRY_SEC,
      );

      // Set nonce in HttpOnly cookie for client binding
      const response = NextResponse.json(
        { mfaRequired: true, challengeToken },
        { status: 200 },
      );

      response.cookies.set("mfa_challenge_nonce", nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: MFA_CHALLENGE_EXPIRY_SEC,
      });

      return response;
    }

    // 9. No MFA — log success and create session via NextAuth
    await db.loginAttempt.create({
      data: {
        userId: user.id,
        ipHash,
        userAgent: request.headers.get("user-agent") || null,
        success: true,
        method: "EMAIL",
      },
    });

    await signIn("email-password", {
      userId: user.id,
      mfaVerified: "true",
      redirect: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
