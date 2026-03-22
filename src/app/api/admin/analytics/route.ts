import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminApi();
  if (adminCheck.error) return adminCheck.response;

  const period = request.nextUrl.searchParams.get("period") || "30d";

  const now = new Date();
  let since: Date;
  switch (period) {
    case "7d": since = new Date(now.getTime() - 7 * 86400000); break;
    case "30d": since = new Date(now.getTime() - 30 * 86400000); break;
    case "90d": since = new Date(now.getTime() - 90 * 86400000); break;
    default: since = new Date(0);
  }

  const where = { createdAt: { gte: since } };

  const [
    totalViews,
    uniqueVisitors,
    viewsByDay,
    topPages,
    topCountries,
    topReferrers,
    devices,
    browsers,
    osList,
    recentViews,
  ] = await Promise.all([
    db.pageView.count({ where }),
    db.pageView.groupBy({ by: ["ipHash"], where }).then((r) => r.length),
    db.$queryRaw(Prisma.sql`
      SELECT DATE("createdAt") as date,
             COUNT(*)::int as views,
             COUNT(DISTINCT "ipHash")::int as unique_visitors
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `),
    db.pageView.groupBy({
      by: ["path"],
      where,
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    db.pageView.groupBy({
      by: ["country"],
      where: { ...where, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    db.pageView.groupBy({
      by: ["referrer"],
      where: { ...where, referrer: { not: null } },
      _count: { referrer: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    }),
    db.pageView.groupBy({
      by: ["device"],
      where: { ...where, device: { not: null } },
      _count: { device: true },
    }),
    db.pageView.groupBy({
      by: ["browser"],
      where: { ...where, browser: { not: null } },
      _count: { browser: true },
      orderBy: { _count: { browser: "desc" } },
      take: 5,
    }),
    db.pageView.groupBy({
      by: ["os"],
      where: { ...where, os: { not: null } },
      _count: { os: true },
      orderBy: { _count: { os: "desc" } },
      take: 5,
    }),
    db.pageView.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { path: true, country: true, device: true, browser: true, referrer: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    totalViews,
    uniqueVisitors,
    viewsByDay,
    topPages: topPages.map((p) => ({ path: p.path, count: p._count.path })),
    topCountries: topCountries.map((c) => ({ country: c.country, count: c._count.country })),
    topReferrers: topReferrers.map((r) => ({ referrer: r.referrer, count: r._count.referrer })),
    devices: Object.fromEntries(devices.map((d) => [d.device, d._count.device])),
    browsers: browsers.map((b) => ({ browser: b.browser, count: b._count.browser })),
    os: osList.map((o) => ({ os: o.os, count: o._count.os })),
    recentViews,
  });
}
