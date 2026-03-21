import { NextResponse } from "next/server";
import { getSteamLoginUrl } from "@/lib/steam";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callbackUrl = `${siteUrl}/api/auth/steam/callback`;
  const steamUrl = getSteamLoginUrl(callbackUrl);

  return NextResponse.redirect(steamUrl);
}
