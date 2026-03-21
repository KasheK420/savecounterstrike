import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [heartbeatConfig, trackedCount, bannedCount, recentCommands] =
    await Promise.all([
      db.siteConfig.findUnique({ where: { key: "bot_heartbeat" } }),
      db.trackedPlayer.count(),
      db.trackedPlayer.count({ where: { vacBanned: true } }),
      db.botCommand.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const heartbeat = heartbeatConfig?.value as any;

  return NextResponse.json({
    heartbeat,
    trackedCount,
    bannedCount,
    recentCommands,
  });
}
