import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { id } = await params;
  const body = await request.json();

  // Build update data from provided fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  const stringFields = ["name", "role", "email", "socialUrl", "websiteUrl", "avatarUrl", "emailBody", "notes"];
  for (const field of stringFields) {
    if (field in body) data[field] = body[field] || null;
  }
  // Name should never be null
  if ("name" in body && body.name) data.name = body.name;

  const boolFields = ["emailSent", "replied", "engaged", "addToSupporters", "addToNotable"];
  for (const field of boolFields) {
    if (field in body) data[field] = !!body[field];
  }

  // Auto-set timestamps
  if (body.emailSent === true && !body.sentAt) data.sentAt = new Date();
  if (body.emailSent === false) data.sentAt = null;
  if (body.replied === true && !body.repliedAt) data.repliedAt = new Date();
  if (body.replied === false) data.repliedAt = null;

  const contact = await db.outreachContact.update({
    where: { id },
    data,
  });

  // Auto-sync to SiteConfig when supporter/notable flags change
  if ("addToSupporters" in body || "addToNotable" in body) {
    await syncToSiteConfig();
  }

  return NextResponse.json(contact);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { id } = await params;
  await db.outreachContact.delete({ where: { id } });

  // Re-sync after delete
  await syncToSiteConfig();

  return NextResponse.json({ ok: true });
}

async function syncToSiteConfig() {
  // Sync supporters
  const supporters = await db.outreachContact.findMany({
    where: { addToSupporters: true },
    select: { name: true, avatarUrl: true, websiteUrl: true },
  });

  await db.siteConfig.upsert({
    where: { key: "supporters" },
    update: {
      value: {
        items: supporters.map((s) => ({
          name: s.name,
          logoUrl: s.avatarUrl || "",
          url: s.websiteUrl || "",
        })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
    create: {
      key: "supporters",
      value: {
        items: supporters.map((s) => ({
          name: s.name,
          logoUrl: s.avatarUrl || "",
          url: s.websiteUrl || "",
        })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  });

  // Sync notable signers
  const notable = await db.outreachContact.findMany({
    where: { addToNotable: true },
    select: { name: true, avatarUrl: true, role: true },
  });

  await db.siteConfig.upsert({
    where: { key: "notable_signers" },
    update: {
      value: {
        signers: notable.map((n) => ({
          steamId: "",
          label: n.name,
          role: n.role || "Community Figure",
          avatarOverride: n.avatarUrl || null,
        })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
    create: {
      key: "notable_signers",
      value: {
        signers: notable.map((n) => ({
          steamId: "",
          label: n.name,
          role: n.role || "Community Figure",
          avatarOverride: n.avatarUrl || null,
        })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  });
}
