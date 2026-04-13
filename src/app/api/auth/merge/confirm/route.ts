/**
 * @fileoverview Merge confirmation endpoint.
 *
 * Validates the merge JWT, requires proof of ownership of the account
 * being absorbed (password for email accounts, Steam callback proof for
 * Steam-only accounts), then performs the merge and sends a notification.
 *
 * @route POST /api/auth/merge/confirm
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateOrigin } from "@/lib/csrf";
import { verifyPassword } from "@/lib/password";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyJwt } from "@/lib/jwt";
import { accountMergeEmail } from "@/lib/email-templates";
import { mergeAccounts } from "@/lib/account-merge";

/** Shape of the merge confirmation JWT payload */
interface MergeTokenPayload {
  keepUserId: string;
  mergeUserId: string;
  mergeType: "steam" | "email";
  iat: number;
  exp: number;
}

/**
 * POST /api/auth/merge/confirm
 *
 * Body: { mergeToken: string, password?: string }
 *
 * 1. Validate origin (CSRF)
 * 2. Verify mergeToken JWT (contains keepUserId, mergeUserId, mergeType)
 * 3. Require session matching keepUserId
 * 4. Rate limit (3/hour/userId)
 * 5. If mergeUser had email/password -> verify provided password
 * 6. If mergeUser was Steam-only -> Steam callback already proved ownership
 * 7. Call mergeAccounts(keepUserId, mergeUserId)
 * 8. Send accountMergeEmail notification
 * 9. Return 200
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate origin (CSRF)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { mergeToken, password } = body as {
      mergeToken?: string;
      password?: string;
    };

    if (!mergeToken) {
      return NextResponse.json(
        { error: "Merge token is required" },
        { status: 400 },
      );
    }

    // 3. Verify merge JWT
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      console.error("AUTH_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const payload = verifyJwt<MergeTokenPayload>(mergeToken, authSecret);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired merge token" },
        { status: 400 },
      );
    }

    const { keepUserId, mergeUserId, mergeType } = payload;

    // 4. Require authenticated session matching keepUserId
    const session = await auth();
    if (!session?.user?.userId || session.user.userId !== keepUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // 5. Rate limit: 3 per hour per userId
    const rl = rateLimit(`auth:merge-confirm:${keepUserId}`, 3, 3_600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 6. Fetch the merge user to check ownership proof requirements
    const mergeUser = await db.user.findUnique({
      where: { id: mergeUserId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        steamId: true,
        isBanned: true,
        displayName: true,
      },
    });

    if (!mergeUser) {
      return NextResponse.json(
        { error: "Account to merge no longer exists" },
        { status: 404 },
      );
    }

    if (mergeUser.isBanned) {
      return NextResponse.json(
        { error: "Cannot merge a banned account" },
        { status: 403 },
      );
    }

    // 7. Verify ownership of the merge account
    if (mergeType === "email" && mergeUser.passwordHash) {
      // Email accounts require password proof
      if (!password) {
        return NextResponse.json(
          { error: "Password of the account being merged is required" },
          { status: 400 },
        );
      }

      const valid = await verifyPassword(password, mergeUser.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Incorrect password for the account being merged" },
          { status: 401 },
        );
      }
    }
    // For Steam-only merges (mergeType === "steam"), the Steam callback
    // already proved ownership via OpenID verification. No additional
    // proof is needed.

    // 8. Perform the merge
    await mergeAccounts(keepUserId, mergeUserId);

    // 9. Send notification email
    const keepUser = await db.user.findUnique({
      where: { id: keepUserId },
      select: { displayName: true, email: true },
    });

    if (keepUser?.email) {
      const mergedIdentity =
        mergeUser.email || mergeUser.steamId || "another account";

      const emailContent = accountMergeEmail(
        keepUser.displayName,
        mergedIdentity,
      );

      try {
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
          to: keepUser.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } catch (emailError) {
        // Non-fatal: merge succeeded, email notification failed
        console.error("Merge notification email failed:", emailError);
      }
    }

    return NextResponse.json({
      message: "Accounts merged successfully",
    });
  } catch (error) {
    console.error("Merge confirm error:", error);

    // Surface specific merge errors
    if (error instanceof Error) {
      if (error.message === "Cannot merge banned account") {
        return NextResponse.json(
          { error: "Cannot merge a banned account" },
          { status: 403 },
        );
      }
      if (error.message === "Cannot absorb elevated role") {
        return NextResponse.json(
          { error: "Account merge requires admin approval for elevated roles" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
