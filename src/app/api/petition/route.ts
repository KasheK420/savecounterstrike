/**
 * @fileoverview Petition signing API.
 *
 * Handles retrieving petition statistics, signing the petition,
 * and admin deletion of signatures.
 *
 * @route GET    /api/petition       - Get signature count and recent signers
 * @route POST   /api/petition       - Sign the petition (authenticated)
 * @route DELETE /api/petition?id=   - Delete signature (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { petitionSignSchema } from "@/lib/validations";
import { filterProfanity } from "@/lib/profanity";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

// ── Database Select Configurations ──────────────────────────

/** Full user data with CS2/FACEIT stats */
const USER_SELECT_WITH_STATS = {
  id: true,
  displayName: true,
  avatarUrl: true,
  ownsCs2: true,
  cs2PlaytimeHours: true,
  faceitLevel: true,
  faceitElo: true,
  profileVisibility: true,
  hidePlaytime: true,
  hideFaceit: true,
} as const;

/** Basic user data (fallback for compatibility) */
const USER_SELECT_BASE = {
  id: true,
  displayName: true,
  avatarUrl: true,
} as const;

/**
 * GET /api/petition
 * Returns total signature count and 100 most recent signers with user data.
 * Handles both authenticated (user-linked) and manual (unverified) signatures.
 */
export async function GET() {
  // Try with stats fields first, fall back to base if migration not applied yet
  try {
    const [count, recentSigners] = await Promise.all([
      db.petitionSignature.count(),
      db.petitionSignature.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          message: true,
          verified: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
          user: { select: USER_SELECT_WITH_STATS },
        },
      }),
    ]);

    // Normalize: manual signatures embed profile data directly, authenticated ones use the user relation
    // Respect privacy flags — strip stats when user opts out
    const normalized = recentSigners.map((sig) => {
      const base = {
        id: sig.id,
        createdAt: sig.createdAt,
        message: sig.message,
        verified: sig.verified,
      };
      if (!sig.user) {
        return {
          ...base,
          user: {
            id: sig.id,
            displayName: sig.displayName || "Anonymous",
            avatarUrl: sig.avatarUrl || null,
            ownsCs2: null,
            cs2PlaytimeHours: null,
            faceitLevel: null,
            faceitElo: null,
            profileVisibility: null,
          },
        };
      }
      const { hidePlaytime, hideFaceit, ...userData } = sig.user;
      return {
        ...base,
        user: {
          ...userData,
          cs2PlaytimeHours: hidePlaytime ? null : userData.cs2PlaytimeHours,
          faceitLevel: hideFaceit ? null : userData.faceitLevel,
          faceitElo: hideFaceit ? null : userData.faceitElo,
        },
      };
    });

    return NextResponse.json({ count, recentSigners: normalized });
  } catch {
    // Stats columns likely don't exist yet — query without them
    const [count, recentSigners] = await Promise.all([
      db.petitionSignature.count(),
      db.petitionSignature.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          message: true,
          verified: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
          user: { select: USER_SELECT_BASE },
        },
      }),
    ]);

    const normalized = recentSigners.map((sig) => ({
      id: sig.id,
      createdAt: sig.createdAt,
      message: sig.message,
      verified: sig.verified,
      user: sig.user
        ? sig.user
        : {
            id: sig.id,
            displayName: sig.displayName || "Anonymous",
            avatarUrl: sig.avatarUrl || null,
          },
    }));

    return NextResponse.json({ count, recentSigners: normalized });
  }
}

/**
 * POST /api/petition
 * Signs the petition for the authenticated user.
 * Rate limit: 3 attempts per 10 minutes per IP.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 3 petition attempts per 10 minutes per IP
  const rl = rateLimitByIp(request, "petition:sign", 3, 600_000);
  if (rl.limited) return rateLimitResponse(rl);

  const { requireActiveUserApi } = await import("@/lib/admin");
  const userCheck = await requireActiveUserApi();
  if (userCheck.error) return userCheck.response;
  const session = userCheck.session;

  const body = await request.json();
  const parsed = petitionSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check for existing signature (one per user)
  const existing = await db.petitionSignature.findFirst({
    where: { userId: session.user.userId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already signed the petition" },
      { status: 409 }
    );
  }

  // Filter profanity from optional message
  const cleanMessage = parsed.data.message
    ? filterProfanity(parsed.data.message)
    : undefined;

  const signature = await db.petitionSignature.create({
    data: {
      userId: session.user.userId,
      verified: true,
      message: cleanMessage,
    },
  });

  return NextResponse.json(signature, { status: 201 });
}

/**
 * DELETE /api/petition?id={signatureId}
 * Removes a signature (admin only).
 */
export async function DELETE(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { searchParams } = request.nextUrl;
  const signatureId = searchParams.get("id");

  if (!signatureId) {
    return NextResponse.json(
      { error: "Missing signature id" },
      { status: 400 }
    );
  }

  const signature = await db.petitionSignature.findUnique({
    where: { id: signatureId },
  });

  if (!signature) {
    return NextResponse.json(
      { error: "Signature not found" },
      { status: 404 }
    );
  }

  await db.petitionSignature.delete({
    where: { id: signatureId },
  });

  return NextResponse.json({ success: true });
}
