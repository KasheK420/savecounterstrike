/**
 * @fileoverview Initiate Steam account linking for an authenticated user.
 *
 * Redirects the user to Steam OpenID to link their Steam account to an
 * existing email-based account. Uses a separate state cookie and callback
 * URL from the main Steam login flow to avoid confusion.
 *
 * @route GET /api/auth/link/steam
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSteamLoginUrl } from "@/lib/steam";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/auth/link/steam
 *
 * 1. Require authenticated session
 * 2. Rate limit (5/hour/userId)
 * 3. Verify user doesn't already have steamId
 * 4. Generate CSRF state, store in steam_link_state cookie
 * 5. Redirect to Steam OpenID
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // 1. Require authenticated session
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.userId;

    // 2. Rate limit: 5 per hour per userId
    const rl = rateLimit(`auth:link-steam:${userId}`, 5, 3_600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // 3. Check user doesn't already have a linked Steam account
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { steamId: true },
    });

    if (user?.steamId) {
      return NextResponse.redirect(
        `${siteUrl}/?error=steam_already_linked`,
      );
    }

    // 4. Generate CSRF state token and store in cookie
    const state = crypto.randomUUID();
    const cookieStore = await cookies();
    cookieStore.set("steam_link_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minute expiry
      path: "/",
    });

    // 5. Build Steam OpenID URL with link callback
    const callbackUrl = `${siteUrl}/api/auth/link/steam/callback`;
    const steamUrl = getSteamLoginUrl(`${callbackUrl}?state=${state}`);

    return NextResponse.redirect(steamUrl);
  } catch (error) {
    console.error("Steam link initiation error:", error);
    return NextResponse.redirect(`${siteUrl}/?error=link_error`);
  }
}
