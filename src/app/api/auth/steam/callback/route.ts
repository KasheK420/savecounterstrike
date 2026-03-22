/**
 * @fileoverview Steam OpenID authentication callback handler.
 *
 * Receives the OpenID response from Steam, validates the signature,
 * fetches profile data and CS2 stats, then creates/updates the user
 * and establishes a session via NextAuth.
 *
 * @route GET /api/auth/steam/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySteamLogin, fetchSteamProfile } from "@/lib/steam";
import { fetchCS2Stats } from "@/lib/steam-stats";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";

/**
 * Handle Steam OpenID callback.
 * Validates state, verifies Steam signature, fetches stats, creates session.
 */
export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // ── CSRF Protection ────────────────────────────────────────
    // Validate the state parameter matches the cookie we set
    const params = request.nextUrl.searchParams;
    const state = params.get("state");
    const cookieStore = await cookies();
    const storedState = cookieStore.get("steam_oauth_state")?.value;
    cookieStore.delete("steam_oauth_state"); // Clear used state

    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(`${siteUrl}/?error=invalid_state`);
    }

    // ── Steam Verification ────────────────────────────────────
    const steamId = await verifySteamLogin(params);
    if (!steamId) {
      return NextResponse.redirect(`${siteUrl}/?error=steam_auth_failed`);
    }

    // ── Ban Check ─────────────────────────────────────────────
    // Prevent banned users from signing in
    const existingUser = await db.user.findUnique({
      where: { steamId },
      select: { isBanned: true },
    });
    if (existingUser?.isBanned) {
      return NextResponse.redirect(`${siteUrl}/?error=account_banned`);
    }

    // ── Profile Fetch ─────────────────────────────────────────
    const profile = await fetchSteamProfile(steamId);
    if (!profile) {
      return NextResponse.redirect(`${siteUrl}/?error=steam_profile_failed`);
    }

    // ── Stats Fetch (Non-fatal) ─────────────────────────────
    // Fetch CS2 stats; FACEIT is client-side only (API blocks servers)
    const apiKey = process.env.STEAM_API_KEY;
    if (apiKey) {
      try {
        const stats = await fetchCS2Stats(steamId, apiKey);

        const statsUpdate: Record<string, unknown> = {
          statsUpdatedAt: new Date(),
        };

        if (stats) {
          statsUpdate.ownsCs2 = stats.ownsCs2;
          statsUpdate.cs2PlaytimeHours = stats.playtimeHours;
          statsUpdate.cs2Kills = stats.kills;
          statsUpdate.cs2Deaths = stats.deaths;
          statsUpdate.cs2Wins = stats.wins;
          statsUpdate.cs2HeadshotPct = stats.headshotPct;
          statsUpdate.profileVisibility =
            stats.profileVisibility === "public" ? 3 : 1;
        }

        // Upsert user with stats
        await db.user.upsert({
          where: { steamId },
          update: statsUpdate,
          create: {
            steamId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            profileUrl: profile.profileUrl,
            ...statsUpdate,
          },
        });
      } catch (e) {
        console.error("Stats fetch failed:", e);
        // Non-fatal — continue with auth even if stats fail
      }
    }

    // ── Session Creation ─────────────────────────────────────
    await signIn("steam", {
      steamId: profile.steamId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      redirect: false,
    });

    return NextResponse.redirect(siteUrl);
  } catch (error) {
    console.error("Steam callback error:", error);
    return NextResponse.redirect(`${siteUrl}/?error=auth_error`);
  }
}
