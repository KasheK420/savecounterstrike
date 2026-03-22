import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const contacts = await db.outreachContact.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const body = await request.json();

  const contact = await db.outreachContact.create({
    data: {
      name: body.name,
      role: body.role || "Other",
      email: body.email || null,
      socialUrl: body.socialUrl || null,
      websiteUrl: body.websiteUrl || null,
      avatarUrl: body.avatarUrl || null,
      emailBody: body.emailBody || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
