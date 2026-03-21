import { NextRequest, NextResponse } from "next/server";
import { verifySteamLogin, fetchSteamProfile } from "@/lib/steam";
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
