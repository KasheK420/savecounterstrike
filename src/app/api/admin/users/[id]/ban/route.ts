import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

// POST — Ban user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = (body.reason as string)?.trim()?.slice(0, 500) || null;

  const adminUserId = result.session.user?.userId;

  // Can't ban yourself
  if (id === adminUserId) {
    return NextResponse.json(
      { error: "You cannot ban yourself." },
      { status: 403 }
    );
  }

  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Can't ban other admins
  if (targetUser.role === "ADMIN") {
    return NextResponse.json(
      { error: "Cannot ban an admin. Demote them first." },
      { status: 403 }
    );
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      isBanned: true,
      bannedAt: new Date(),
      bannedReason: reason,
    },
    select: { id: true, displayName: true, isBanned: true },
  });

  return NextResponse.json(updated);
}

// DELETE — Unban user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { id } = await params;

  const updated = await db.user.update({
    where: { id },
    data: {
      isBanned: false,
      bannedAt: null,
      bannedReason: null,
    },
    select: { id: true, displayName: true, isBanned: true },
  });

  return NextResponse.json(updated);
}
