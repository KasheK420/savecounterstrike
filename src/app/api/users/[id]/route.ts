/**
 * @fileoverview User profile API.
 *
 * Retrieve public profile data or update own profile settings.
 *
 * @route GET   /api/users/{id} - Get user profile
 * @route PATCH /api/users/{id} - Update own profile
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/users/{id}
 * Retrieve public profile information for a user.
 * Includes stats, petition status, recent opinions, and content counts.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      bio: true,
      karma: true,
      customName: true,
      hidePlaytime: true,
      hideFaceit: true,
      ownsCs2: true,
      cs2PlaytimeHours: true,
      cs2Wins: true,
      cs2HeadshotPct: true,
      faceitLevel: true,
      faceitElo: true,
      profileVisibility: true,
      petitionSignature: {
        select: { createdAt: true, message: true },
      },
      opinions: {
        where: { status: "APPROVED" },
        orderBy: { score: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          score: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      },
      _count: {
        select: { opinions: true, comments: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Enforce privacy flags for non-owner viewers
  const session = await auth();
  const isOwner = session?.user?.userId === id;
  if (!isOwner) {
    if (user.hidePlaytime) {
      user.cs2PlaytimeHours = null;
      user.cs2Wins = null;
      user.cs2HeadshotPct = null;
    }
    if (user.hideFaceit) {
      user.faceitLevel = null;
      user.faceitElo = null;
    }
  }

  return NextResponse.json(user);
}

/**
 * PATCH /api/users/{id}
 * Update own profile. Users can only modify their own profile.
 * Supports: bio, customName, hidePlaytime, hideFaceit.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { requireActiveUserApi } = await import("@/lib/admin");
  const userCheck = await requireActiveUserApi();
  if (userCheck.error) return userCheck.response;
  const userId = userCheck.session.user!.userId!;

  const { id } = await params;

  // Verify ownership
  if (id !== userId) {
    return NextResponse.json(
      { error: "You can only edit your own profile" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  // Update bio (max 500 chars, profanity filtered)
  if (typeof body.bio === "string") {
    const { filterProfanity } = await import("@/lib/profanity");
    data.bio = filterProfanity(body.bio.trim().slice(0, 500)) || null;
  }

  // Update custom name (max 32 chars, profanity filtered)
  if (typeof body.customName === "string") {
    const { filterProfanity } = await import("@/lib/profanity");
    const name = body.customName.trim().slice(0, 32);
    data.customName = name ? filterProfanity(name) : null;
  }

  // Update privacy settings
  if (typeof body.hidePlaytime === "boolean") {
    data.hidePlaytime = body.hidePlaytime;
  }
  if (typeof body.hideFaceit === "boolean") {
    data.hideFaceit = body.hideFaceit;
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      bio: true,
      customName: true,
      hidePlaytime: true,
      hideFaceit: true,
    },
  });

  return NextResponse.json(updated);
}
