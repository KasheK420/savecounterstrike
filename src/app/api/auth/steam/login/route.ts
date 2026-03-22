/**
 * @fileoverview Steam OpenID authentication initiation.
 *
 * Generates a CSRF state token, stores it in a cookie, and redirects
 * the user to Steam's OpenID login page.
 *
 * @route GET /api/auth/steam/login
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSteamLoginUrl } from "@/lib/steam";

/**
 * Initiate Steam authentication flow.
 * Creates state cookie for CSRF protection, redirects to Steam.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callbackUrl = `${siteUrl}/api/auth/steam/callback`;

  // ── CSRF State Token ───────────────────────────────────────
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("steam_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minute expiry
    path: "/",
  });

  const steamUrl = getSteamLoginUrl(`${callbackUrl}?state=${state}`);
  return NextResponse.redirect(steamUrl);
}
