import { NextRequest, NextResponse } from "next/server";
import { verifySteamLogin, fetchSteamProfile } from "@/lib/steam";
import { fetchCS2Stats } from "@/lib/steam-stats";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const params = request.nextUrl.searchParams;
    const steamId = await verifySteamLogin(params);

    if (!steamId) {
      return NextResponse.redirect(`${siteUrl}/?error=steam_auth_failed`);
    }

    const profile = await fetchSteamProfile(steamId);
    if (!profile) {
      return NextResponse.redirect(`${siteUrl}/?error=steam_profile_failed`);
    }

    // Fetch CS2 stats (non-fatal — login proceeds even if this fails)
    const apiKey = process.env.STEAM_API_KEY;
    if (apiKey) {
      try {
        const stats = await fetchCS2Stats(steamId, apiKey);
        if (stats) {
          await db.user.upsert({
            where: { steamId },
            update: {
              ownsCs2: stats.ownsCs2,
              cs2PlaytimeHours: stats.playtimeHours,
              profileVisibility: stats.profileVisibility === "public" ? 3 : 1,
              statsUpdatedAt: new Date(),
            },
            create: {
              steamId,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl,
              profileUrl: profile.profileUrl,
              ownsCs2: stats.ownsCs2,
              cs2PlaytimeHours: stats.playtimeHours,
              profileVisibility: stats.profileVisibility === "public" ? 3 : 1,
              statsUpdatedAt: new Date(),
            },
          });
        }
      } catch (e) {
        console.error("CS2 stats fetch failed:", e);
      }
    }

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
