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

  const items = (config?.value as any)?.items || [];
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const body = await request.json();
  const items: SupporterItem[] = (body.items || []).filter(
    (i: any) => i.name && i.logoUrl
  );

  await db.siteConfig.upsert({
    where: { key: "supporters" },
    update: { value: { items } as any },
    create: { key: "supporters", value: { items } as any },
  });

  return NextResponse.json({ ok: true });
}
