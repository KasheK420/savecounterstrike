/**
 * @fileoverview Bot → web supporter deactivation endpoint.
 * Sets isActive=false when a Ko-fi membership expires (role removed on Discord).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBotApi } from "@/lib/admin";
import { supporterDeactivateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const auth = requireBotApi(request);
  if (auth.error) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = supporterDeactivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { discordId } = parsed.data;

  const existing = await db.supporter.findUnique({
    where: { discordId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Supporter not found" }, { status: 404 });
  }

  await db.supporter.update({
    where: { discordId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
