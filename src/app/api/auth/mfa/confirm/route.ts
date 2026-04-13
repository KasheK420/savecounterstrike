/**
 * @fileoverview MFA confirm endpoint (authenticated).
 *
 * Validates a TOTP code against the pending MFA secret from the setup step.
 * On success, activates MFA, stores hashed recovery codes, and sends
 * a notification email.
 *
 * @route POST /api/auth/mfa/confirm
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { db } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { mfaEnabledEmail } from "@/lib/email-templates";
import {
  decryptSecret,
  verifyTotp,
  hashRecoveryCode,
} from "@/lib/mfa";
import { z } from "zod";

/** Zod schema for MFA confirm request body */
const mfaConfirmSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

/**
 * POST /api/auth/mfa/confirm
 *
 * Authenticated endpoint. Accepts a 6-digit TOTP code to confirm
 * the pending MFA setup. Must be called within 10 minutes of setup.
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
    const rl = rateLimit(`auth:mfa-confirm:${userId}`, 5, 3_600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 3. Validate origin (CSRF protection)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Parse and validate code with Zod
    const body = await request.json();
    const parsed = mfaConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { code } = parsed.data;

    // 4. Fetch user with pending MFA data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        pendingMfaSecret: true,
        pendingMfaExpiresAt: true,
      },
    });

    if (!user || !user.pendingMfaSecret || !user.pendingMfaExpiresAt) {
      return NextResponse.json(
        { error: "No pending MFA setup found. Please start setup again." },
        { status: 400 },
      );
    }

    // 5. Check pending setup has not expired
    if (new Date() > user.pendingMfaExpiresAt) {
      // Clear expired pending data
      await db.user.update({
        where: { id: userId },
        data: { pendingMfaSecret: null, pendingMfaExpiresAt: null },
      });
      return NextResponse.json(
        { error: "MFA setup expired. Please start setup again." },
        { status: 400 },
      );
    }

    // 6. Parse pending data and decrypt secret
    const pendingData = JSON.parse(user.pendingMfaSecret) as {
      encryptedSecret: string;
      recoveryCodes: string[];
    };
    const decryptedSecret = decryptSecret(pendingData.encryptedSecret);

    // 7. Verify TOTP code against decrypted secret
    const result = verifyTotp(decryptedSecret, code);
    if (!result.valid) {
      return NextResponse.json(
        { error: "Invalid code. Please try again." },
        { status: 400 },
      );
    }

    // 8. Hash all recovery codes for storage
    const hashedCodes = await Promise.all(
      pendingData.recoveryCodes.map((rc) => hashRecoveryCode(rc)),
    );

    // 9. Transaction: activate MFA, store codes, rotate security stamp
    await db.$transaction(async (tx) => {
      // a. Move pending secret to active, enable MFA
      await tx.user.update({
        where: { id: userId },
        data: {
          mfaSecret: pendingData.encryptedSecret,
          mfaEnabled: true,
          lastTotpStep: result.step,
          pendingMfaSecret: null,
          pendingMfaExpiresAt: null,
          securityStamp: crypto.randomUUID(),
        },
      });

      // b. Delete any existing recovery codes (in case of re-setup)
      await tx.mfaRecoveryCode.deleteMany({ where: { userId } });

      // c. Create hashed recovery code rows
      await tx.mfaRecoveryCode.createMany({
        data: hashedCodes.map((codeHash) => ({
          userId,
          codeHash,
        })),
      });
    });

    // 10. Send MFA enabled notification email (best-effort, don't block response)
    if (user.email) {
      const emailContent = mfaEnabledEmail(user.displayName);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.protonmail.ch",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || "contact@savecounterstrike.com",
          pass: process.env.SMTP_PASS,
        },
      });

      transporter
        .sendMail({
          from: `"SaveCounterStrike" <${process.env.SMTP_USER || "contact@savecounterstrike.com"}>`,
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        })
        .catch((err: unknown) => {
          console.error("Failed to send MFA enabled email:", err);
        });
    }

    return NextResponse.json({
      message: "MFA enabled successfully",
    });
  } catch (error) {
    console.error("MFA confirm error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
