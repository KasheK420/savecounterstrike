/**
 * @fileoverview Public supporters API.
 * GET returns both Ko-fi supporters from DB and static corporate sponsors from SiteConfig.
 * POST allows admins to update the static sponsors list.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export interface SupporterItem {
  name: string;
  logoUrl: string;
  url?: string;
}

export async function GET() {
  // Fetch Ko-fi supporters (active, ordered by tier then join date)
  const supporters = await db.supporter.findMany({
    where: { isActive: true },
    orderBy: [{ tierLevel: "desc" }, { createdAt: "asc" }],
    select: {
      displayName: true,
      avatarUrl: true,
      tier: true,
      tierLevel: true,
      customMessage: true,
      steamId: true,
      createdAt: true,
    },
  });

  // Fetch static corporate sponsors from SiteConfig
  const config = await db.siteConfig.findUnique({
    where: { key: "supporters" },
  });

  const sponsors = (config?.value as unknown as { items?: SupporterItem[] })?.items || [];

  return NextResponse.json({ supporters, sponsors });
}

export async function POST(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const body = await request.json();
  const items: SupporterItem[] = (body.items || []).filter(
    (i: SupporterItem) => i.name && i.logoUrl
  );

  await db.siteConfig.upsert({
    where: { key: "supporters" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { value: { items } as any },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { key: "supporters", value: { items } as any },
  });

  return NextResponse.json({ ok: true });
}
