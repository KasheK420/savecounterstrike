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

    // Fetch CS2 stats + FACEIT in parallel (non-fatal)
    const apiKey = process.env.STEAM_API_KEY;
    if (apiKey) {
      try {
        const stats = await fetchCS2Stats(steamId, apiKey);
        // FACEIT data is fetched client-side (FaceitSync component)
        // because FACEIT API blocks server/datacenter IPs via Cloudflare

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
