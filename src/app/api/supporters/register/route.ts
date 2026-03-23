/**
 * @fileoverview Bot → web supporter registration endpoint.
 * Upserts a Ko-fi supporter record. Called by savecs-bot when
 * a user runs /supporter on Discord.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBotApi } from "@/lib/admin";
import { supporterRegisterSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const auth = requireBotApi(request);
  if (auth.error) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = supporterRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const supporter = await db.supporter.upsert({
    where: { discordId: data.discordId },
    update: {
      steamId: data.steamId,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl ?? null,
      tier: data.tier,
      tierLevel: data.tierLevel,
      customMessage: data.customMessage ?? null,
      isActive: true,
    },
    create: {
      discordId: data.discordId,
      steamId: data.steamId,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      tier: data.tier,
      tierLevel: data.tierLevel,
      customMessage: data.customMessage,
      isActive: true,
    },
  });

  return NextResponse.json({
    ok: true,
    supporter: {
      id: supporter.id,
      tier: supporter.tier,
      isActive: supporter.isActive,
    },
  });
}
