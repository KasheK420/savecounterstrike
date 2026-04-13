/**
 * @fileoverview Forgot password endpoint.
 *
 * Accepts an email address and, if an account exists, sends a password reset
 * link. Always returns 200 regardless of whether the email exists to prevent
 * user enumeration.
 *
 * @route POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { resetRequestSchema } from "@/lib/auth-validation";
import { validateOrigin } from "@/lib/csrf";
import { db } from "@/lib/db";
import { passwordResetEmail } from "@/lib/email-templates";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import { generateResetToken } from "@/lib/tokens";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Consistent response to prevent timing-based enumeration. */
const SUCCESS_RESPONSE = {
  message: "If an account exists, a reset link has been sent",
};

/**
 * POST /api/auth/forgot-password
 *
 * Rate limited to 3 requests per hour per IP. Always returns 200 with a
 * generic message to prevent account enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit: 3 per hour per IP
    const rl = rateLimitByIp(request, "auth:forgot-password", 3, 3600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 2. Validate origin (CSRF protection)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const parsed = resetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // 4. Look up user by email
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, displayName: true },
    });

    if (user) {
      // 5a. Invalidate all existing unused reset tokens for this user
      await db.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // 5b. Generate a new reset token
      const { raw, hash: tokenHash, expiresAt } = generateResetToken();

      // 5c. Store the hashed token in the database
      await db.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      // 5d. Send the reset email
      const resetUrl = `${SITE_URL}/auth/reset-password?token=${raw}`;
      const emailContent = passwordResetEmail(user.displayName, resetUrl);

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
    } else {
      // 6. No user found — add a small delay to match the timing of the
      //    success path, preventing timing-based enumeration.
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.floor(Math.random() * 300)));
    }

    // 7. Always return the same 200 response
    return NextResponse.json(SUCCESS_RESPONSE);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(SUCCESS_RESPONSE);
  }
}
