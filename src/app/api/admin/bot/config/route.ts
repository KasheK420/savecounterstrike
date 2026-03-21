import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await db.siteConfig.findUnique({
    where: { key: "bot_config" },
  });

  return NextResponse.json(config?.value ?? {});
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
