/**
 * @fileoverview Manual petition signing API (without Steam login).
 *
 * Allows users to sign the petition by providing their Steam profile URL or Steam64 ID.
 * The Steam profile is verified via the Steam API but no login is required.
 * Manual signatures are marked as unverified (verified: false).
 *
 * @route POST /api/petition/manual
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchSteamProfile, resolveVanityURL, parseSteamInput } from "@/lib/steam";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/petition/manual
 * Sign the petition using a Steam profile URL or ID (no login required).
 * Rate limit: 3 attempts per 10 minutes per IP.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 3 petition attempts per 10 minutes per IP
  const rl = rateLimitByIp(request, "petition:manual", 3, 600_000);
  if (rl.limited) return rateLimitResponse(rl);

  const body = await request.json();
  const steamInput = body.steamInput?.trim();

  if (!steamInput) {
    return NextResponse.json({ error: "Steam URL or ID is required" }, { status: 400 });
  }

  // Parse input
  const parsed = parseSteamInput(steamInput);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid Steam URL or ID format" }, { status: 400 });
  }

  // Resolve to Steam64 ID
  let steamId: string;
  if (parsed.type === "vanity") {
    const resolved = await resolveVanityURL(parsed.value);
    if (!resolved) {
      return NextResponse.json({ error: "Could not find that Steam profile" }, { status: 404 });
    }
    steamId = resolved;
  } else {
    steamId = parsed.value;
  }

  // Check if already signed via Steam login (User with this steamId who has a signature)
  const existingUser = await db.user.findUnique({ where: { steamId } });
  if (existingUser) {
    const existingSig = await db.petitionSignature.findFirst({
      where: { userId: existingUser.id },
    });
    if (existingSig) {
      return NextResponse.json(
        { error: "This Steam account has already signed the petition" },
        { status: 409 }
      );
    }
  }

  // Check if already signed manually (by steamId on the signature itself)
  const existingManual = await db.petitionSignature.findFirst({
    where: { steamId, verified: false },
  });
  if (existingManual) {
    return NextResponse.json(
      { error: "This Steam account has already signed the petition" },
      { status: 409 }
    );
  }

  // Fetch Steam profile to verify it exists
  const profile = await fetchSteamProfile(steamId);
  if (!profile) {
    return NextResponse.json(
      { error: "Could not verify this Steam profile. Make sure it exists." },
      { status: 404 }
    );
  }

  // Create manual signature (unverified, no userId)
  await db.petitionSignature.create({
    data: {
      verified: false,
      steamId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    },
  });

  return NextResponse.json({ success: true, displayName: profile.displayName }, { status: 201 });
}
