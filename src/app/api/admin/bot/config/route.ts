import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const config = await db.siteConfig.findUnique({
    where: { key: "bot_config" },
  });

  return NextResponse.json(config?.value ?? {});
}

export async function POST(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const body = await request.json();

  // If steamGuardCode is set, store it separately for bot to pick up
  if (body.steamGuardCode) {
    await db.siteConfig.upsert({
      where: { key: "bot_steam_guard_code" },
      update: { value: { code: body.steamGuardCode, timestamp: new Date() } },
      create: {
        key: "bot_steam_guard_code",
        value: { code: body.steamGuardCode, timestamp: new Date() },
      },
    });
    delete body.steamGuardCode;
  }

  await db.siteConfig.upsert({
    where: { key: "bot_config" },
    update: { value: body },
    create: { key: "bot_config", value: body },
  });

  return NextResponse.json({ success: true });
}
