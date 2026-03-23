/**
 * @fileoverview Petition signature status check.
 *
 * Quick endpoint to check if the current user has signed the petition.
 * Used to update UI state without full page reload.
 *
 * @route GET /api/petition/check
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/petition/check
 * Check if authenticated user has signed the petition.
 *
 * @returns { signed: boolean, authenticated: boolean }
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ signed: false, authenticated: false });
  }

  const existing = await db.petitionSignature.findFirst({
    where: { userId: session.user.userId },
  });

  return NextResponse.json({
    signed: !!existing,
    authenticated: true,
  });
}
