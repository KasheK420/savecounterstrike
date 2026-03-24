import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const result = await requireAdminApi();
  if (result.error) return result.response;

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

  const heartbeat = heartbeatConfig?.value as unknown;

  return NextResponse.json({
    heartbeat,
    trackedCount,
    bannedCount,
    recentCommands,
  });
}
