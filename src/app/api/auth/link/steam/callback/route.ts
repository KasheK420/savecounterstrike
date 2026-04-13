/**
 * @fileoverview Steam account linking callback handler.
 *
 * Receives the OpenID response from Steam after the user initiated
 * a link from their profile. If the Steam account is unlinked, it
 * attaches it to the current user. If it belongs to another account,
 * it initiates the merge confirmation flow.
 *
 * @route GET /api/auth/link/steam/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifySteamLogin, fetchSteamProfile } from "@/lib/steam";
import { fetchCS2Stats } from "@/lib/steam-stats";
import { signJwt } from "@/lib/jwt";

/** Merge confirmation JWT lifetime: 10 minutes */
const MERGE_TOKEN_EXPIRY_SEC = 10 * 60;

/**
 * GET /api/auth/link/steam/callback
 *
 * 1. Validate state cookie (CSRF)
 * 2. Verify Steam OpenID response
 * 3. Require authenticated session
 * 4. Check if steamId is already linked:
 *    a. Not linked -> attach to current user
 *    b. Linked to another user -> initiate merge flow
 */
export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // ── CSRF Protection ────────────────────────────────────────
    const params = request.nextUrl.searchParams;
    const state = params.get("state");
    const cookieStore = await cookies();
    const storedState = cookieStore.get("steam_link_state")?.value;
    cookieStore.delete("steam_link_state");

    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(`${siteUrl}/?error=invalid_state`);
    }

    // ── Steam Verification ────────────────────────────────────
    const steamId = await verifySteamLogin(params);
    if (!steamId) {
      return NextResponse.redirect(`${siteUrl}/?error=steam_auth_failed`);
    }

    // ── Session Check ─────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.redirect(`${siteUrl}/auth/login?error=session_expired`);
    }

    const currentUserId = session.user.userId;

    // ── Check if steamId already linked ──────────────────────
    const existingUser = await db.user.findUnique({
      where: { steamId },
      select: {
        id: true,
        isBanned: true,
        role: true,
        displayName: true,
      },
    });

    // Case A: Steam account not linked to anyone -> attach to current user
    if (!existingUser) {
      // Fetch Steam profile
      const profile = await fetchSteamProfile(steamId);

      // Update user with Steam identity
      const updateData: Record<string, unknown> = { steamId };
      if (profile) {
        // Only set avatar/profile if user doesn't have them already
        const currentUser = await db.user.findUnique({
          where: { id: currentUserId },
          select: { avatarUrl: true, profileUrl: true },
        });
        if (!currentUser?.avatarUrl) updateData.avatarUrl = profile.avatarUrl;
        if (!currentUser?.profileUrl) updateData.profileUrl = profile.profileUrl;
      }

      // Fetch CS2 stats (non-fatal)
      const apiKey = process.env.STEAM_API_KEY;
      if (apiKey) {
        try {
          const stats = await fetchCS2Stats(steamId, apiKey);
          if (stats) {
            updateData.ownsCs2 = stats.ownsCs2;
            updateData.cs2PlaytimeHours = stats.playtimeHours;
            updateData.cs2Kills = stats.kills;
            updateData.cs2Deaths = stats.deaths;
            updateData.cs2Wins = stats.wins;
            updateData.cs2HeadshotPct = stats.headshotPct;
            updateData.statsUpdatedAt = new Date();
            updateData.profileVisibility =
              stats.profileVisibility === "public" ? 3 : 1;
          }
        } catch (e) {
          console.error("Stats fetch failed during steam link:", e);
        }
      }

      await db.user.update({
        where: { id: currentUserId },
        data: updateData,
      });

      return NextResponse.redirect(`${siteUrl}/?success=steam_linked`);
    }

    // Guard: don't merge with yourself
    if (existingUser.id === currentUserId) {
      return NextResponse.redirect(`${siteUrl}/?error=steam_already_linked`);
    }

    // Case B: Steam account linked to another user -> merge flow
    if (existingUser.isBanned) {
      return NextResponse.redirect(`${siteUrl}/?error=cannot_link_banned`);
    }

    // Check if the other user has a higher role
    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (
      (existingUser.role === "ADMIN" || existingUser.role === "MODERATOR") &&
      currentUser?.role === "USER"
    ) {
      return NextResponse.redirect(
        `${siteUrl}/?error=merge_requires_admin_approval`,
      );
    }

    // Generate merge confirmation JWT
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      console.error("AUTH_SECRET is not configured");
      return NextResponse.redirect(`${siteUrl}/?error=server_error`);
    }

    const mergeToken = signJwt(
      {
        keepUserId: currentUserId,
        mergeUserId: existingUser.id,
        mergeType: "steam",
      },
      authSecret,
      MERGE_TOKEN_EXPIRY_SEC,
    );

    return NextResponse.redirect(
      `${siteUrl}/auth/merge?token=${encodeURIComponent(mergeToken)}`,
    );
  } catch (error) {
    console.error("Steam link callback error:", error);
    return NextResponse.redirect(`${siteUrl}/?error=link_error`);
  }
}
