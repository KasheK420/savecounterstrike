/**
 * @fileoverview Link email/password to an existing Steam-only account.
 *
 * Allows a user authenticated via Steam to add email + password credentials.
 * If the email already belongs to another account, initiates the merge
 * confirmation flow instead.
 *
 * @route POST /api/auth/link/email
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkEmailSchema } from "@/lib/auth-validation";
import { validateOrigin } from "@/lib/csrf";
import {
  hashPassword,
  validatePasswordStrength,
  checkBreachedPassword,
} from "@/lib/password";
import { generateVerifyToken, hashToken } from "@/lib/tokens";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verificationEmail } from "@/lib/email-templates";
import { signJwt } from "@/lib/jwt";

/** Merge confirmation JWT lifetime: 10 minutes */
const MERGE_TOKEN_EXPIRY_SEC = 10 * 60;

/**
 * POST /api/auth/link/email
 *
 * 1. Require authenticated session
 * 2. Rate limit (5/hour/userId)
 * 3. Validate origin (CSRF)
 * 4. Parse + validate body with linkEmailSchema
 * 5. Validate password strength + HIBP check
 * 6. If email not used -> set email/passwordHash, send verify email
 * 7. If email exists on another user -> initiate merge flow
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
    const rl = rateLimit(`auth:link-email:${userId}`, 5, 3_600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 3. Validate origin (CSRF)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const parsed = linkEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // 5. Validate password strength
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { error: "Password too weak", details: strength.errors },
        { status: 400 },
      );
    }

    // 6. Check HIBP breach database
    const breached = await checkBreachedPassword(password);
    if (breached) {
      return NextResponse.json(
        {
          error:
            "This password has appeared in a data breach. Please choose a different one.",
        },
        { status: 400 },
      );
    }

    // 7. Check if current user already has an email
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (currentUser?.email) {
      return NextResponse.json(
        { error: "This account already has an email linked" },
        { status: 400 },
      );
    }

    // 8. Check if email exists on another account
    const existingUser = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        isBanned: true,
        role: true,
      },
    });

    // Case A: Email not used -> link to current user
    if (!existingUser) {
      const passwordHash = await hashPassword(password);

      await db.user.update({
        where: { id: userId },
        data: { email, passwordHash },
      });

      // Generate verification token
      const verifyToken = generateVerifyToken();
      await db.emailVerifyToken.create({
        data: {
          userId,
          tokenHash: hashToken(verifyToken.raw),
          expiresAt: verifyToken.expiresAt,
        },
      });

      // Send verification email
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const verifyUrl = `${siteUrl}/api/auth/verify-email?token=${verifyToken.raw}`;

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      });

      const emailContent = verificationEmail(
        user?.displayName || "User",
        verifyUrl,
      );

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
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      return NextResponse.json({
        message: "Email linked. Check your inbox to verify.",
      });
    }

    // Guard: don't merge with yourself
    if (existingUser.id === userId) {
      return NextResponse.json(
        { error: "This email is already linked to your account" },
        { status: 400 },
      );
    }

    // Case B: Email belongs to another user -> merge flow
    if (existingUser.isBanned) {
      return NextResponse.json(
        { error: "Cannot link to a banned account" },
        { status: 403 },
      );
    }

    // Check if the other user has a higher role
    const selfUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      (existingUser.role === "ADMIN" || existingUser.role === "MODERATOR") &&
      selfUser?.role === "USER"
    ) {
      return NextResponse.json(
        { error: "Account merge requires admin approval" },
        { status: 403 },
      );
    }

    // Generate merge confirmation JWT
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      console.error("AUTH_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const mergeToken = signJwt(
      {
        keepUserId: userId,
        mergeUserId: existingUser.id,
        mergeType: "email",
      },
      authSecret,
      MERGE_TOKEN_EXPIRY_SEC,
    );

    return NextResponse.json({
      mergeRequired: true,
      mergeToken,
    });
  } catch (error) {
    console.error("Email link error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
