import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSteamLoginUrl } from "@/lib/steam";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callbackUrl = `${siteUrl}/api/auth/steam/callback`;

  // Generate CSRF state token
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("steam_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  const steamUrl = getSteamLoginUrl(`${callbackUrl}?state=${state}`);
  return NextResponse.redirect(steamUrl);
}
