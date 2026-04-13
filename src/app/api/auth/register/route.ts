/**
 * @fileoverview Email registration endpoint.
 *
 * Creates a new user with email/password credentials and sends
 * a verification email. Returns the same 200 response regardless
 * of whether the email already exists (anti-enumeration).
 *
 * @route POST /api/auth/register
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/auth-validation";
import { validateOrigin } from "@/lib/csrf";
import {
  hashPassword,
  validatePasswordStrength,
  checkBreachedPassword,
} from "@/lib/password";
import { generateVerifyToken, hashToken } from "@/lib/tokens";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import { verificationEmail } from "@/lib/email-templates";

/** Consistent success message returned regardless of outcome (anti-enumeration) */
const SUCCESS_MESSAGE = "Check your email to verify your account";

/**
 * POST /api/auth/register
 *
 * 1. Rate limit (5/hour/IP)
 * 2. Validate origin (CSRF)
 * 3. Parse + validate body
 * 4. Check password strength + HIBP breach
 * 5. Create user (or silently succeed if email taken)
 * 6. Send verification email
 * 7. Return 200 (no session created)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit: 5 registrations per hour per IP
    const rl = rateLimitByIp(request, "auth:register", 5, 3_600_000);
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
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password, displayName } = parsed.data;

    // 4. Validate password strength
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { error: "Password too weak", details: strength.errors },
        { status: 400 },
      );
    }

    // 5. Check HIBP breach database
    const breached = await checkBreachedPassword(password);
    if (breached) {
      return NextResponse.json(
        { error: "This password has appeared in a data breach. Please choose a different one." },
        { status: 400 },
      );
    }

    // 6. Check email uniqueness — return same response if taken (anti-enumeration)
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    // 7. Hash password
    const passwordHash = await hashPassword(password);

    // 8. Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split("@")[0],
      },
    });

    // 9. Generate verification token
    const verifyToken = generateVerifyToken();
    await db.emailVerifyToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(verifyToken.raw),
        expiresAt: verifyToken.expiresAt,
      },
    });

    // 10. Send verification email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verifyUrl = `${siteUrl}/api/auth/verify-email?token=${verifyToken.raw}`;
    const emailContent = verificationEmail(
      user.displayName,
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

    // 11. Return 200 — no session created
    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
