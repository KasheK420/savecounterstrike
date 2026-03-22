import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export interface SupporterItem {
  name: string;
  logoUrl: string;
  url?: string;
}

export async function GET() {
  const config = await db.siteConfig.findUnique({
    where: { key: "supporters" },
  });

  const items = (config?.value as unknown as { items?: SupporterItem[] })?.items || [];
  return NextResponse.json(items);
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
