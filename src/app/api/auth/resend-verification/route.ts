/**
 * @fileoverview Resend email verification endpoint.
 *
 * Allows authenticated users who haven't verified their email
 * to request a new verification link. Invalidates any existing
 * unused tokens before generating a fresh one.
 *
 * @route POST /api/auth/resend-verification
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { generateVerifyToken, hashToken } from "@/lib/tokens";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verificationEmail } from "@/lib/email-templates";

/**
 * POST /api/auth/resend-verification
 *
 * 1. Authenticate (session required)
 * 2. Rate limit (3/hour per userId)
 * 3. Validate origin (CSRF)
 * 4. Check user has unverified email
 * 5. Invalidate old tokens
 * 6. Generate + store new token
 * 7. Send verification email
 * 8. Return 200
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Require authenticated session
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { userId } = session.user;

    // 2. Rate limit: 3 per hour per user
    const rl = rateLimit(`auth:resend-verify:${userId}`, 3, 3_600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 3. CSRF: validate origin header
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    // 4. Fetch user and check eligibility
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true, displayName: true },
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "No email address on this account" },
        { status: 400 },
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 },
      );
    }

    // 5. Invalidate all existing unused tokens for this user
    await db.emailVerifyToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    // 6. Generate new verification token
    const verifyToken = generateVerifyToken();
    await db.emailVerifyToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(verifyToken.raw),
        expiresAt: verifyToken.expiresAt,
      },
    });

    // 7. Send verification email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verifyUrl = `${siteUrl}/api/auth/verify-email?token=${verifyToken.raw}`;
    const emailContent = verificationEmail(user.displayName, verifyUrl);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.protonmail.ch",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "contact@savecounterstrike.com",
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"SaveCounterStrike" <${process.env.SMTP_USER || "contact@savecounterstrike.com"}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // 8. Success
    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
