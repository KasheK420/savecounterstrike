/**
 * @fileoverview MFA disable endpoint (authenticated).
 *
 * Allows a user to disable MFA by verifying their identity with either
 * their password or a recovery code. Admin and moderator accounts
 * cannot disable MFA (mandatory for elevated roles).
 *
 * @route POST /api/auth/mfa/disable
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { db } from "@/lib/db";
import { verifyRecoveryCode } from "@/lib/mfa";
import { verifyPassword } from "@/lib/password";

/**
 * POST /api/auth/mfa/disable
 *
 * Authenticated endpoint. Requires password or recovery code.
 * Blocked for ADMIN and MODERATOR roles (MFA is mandatory).
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

    // 2. Validate origin (CSRF protection)
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { password, recoveryCode } = body as {
      password?: string;
      recoveryCode?: string;
    };

    // 4. Fetch user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        mfaEnabled: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // 5. Admin/moderator cannot disable MFA (mandatory for elevated roles)
    if (user.role === "ADMIN" || user.role === "MODERATOR") {
      return NextResponse.json(
        { error: "MFA is mandatory for your role" },
        { status: 403 },
      );
    }

    // 6. Check MFA is currently enabled
    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is not enabled" },
        { status: 400 },
      );
    }

    // 7. Verify identity — password or recovery code
    let verified = false;

    if (password && user.passwordHash) {
      verified = await verifyPassword(password, user.passwordHash);
    }

    if (!verified && recoveryCode) {
      const codes = await db.mfaRecoveryCode.findMany({
        where: { userId, usedAt: null },
        select: { id: true, codeHash: true },
      });

      for (const rc of codes) {
        const match = await verifyRecoveryCode(recoveryCode, rc.codeHash);
        if (match) {
          // Mark recovery code as used
          await db.mfaRecoveryCode.update({
            where: { id: rc.id },
            data: { usedAt: new Date() },
          });
          verified = true;
          break;
        }
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid password or recovery code" },
        { status: 401 },
      );
    }

    // 8. Transaction: disable MFA, clear secrets, delete codes, rotate stamp
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          lastTotpStep: null,
          pendingMfaSecret: null,
          pendingMfaExpiresAt: null,
          securityStamp: crypto.randomUUID(),
        },
      });

      await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
    });

    // 9. Audit log
    await db.auditLog.create({
      data: {
        action: "mfa_disable",
        userId,
      },
    });

    return NextResponse.json({
      message: "MFA disabled successfully",
    });
  } catch (error) {
    console.error("MFA disable error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
