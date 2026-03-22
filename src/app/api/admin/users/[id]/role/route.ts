import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { id } = await params;
  const body = await request.json();
  const newRole = body.role;

  if (!VALID_ROLES.includes(newRole)) {
    return NextResponse.json(
      { error: "Invalid role. Must be USER, MODERATOR, or ADMIN." },
      { status: 400 }
    );
  }

  const adminUserId = result.session.user?.userId;

  // Can't change your own role (prevents lockout)
  if (id === adminUserId) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 403 }
    );
  }

  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updated = await db.user.update({
    where: { id },
    data: { role: newRole },
    select: { id: true, displayName: true, role: true },
  });

  return NextResponse.json(updated);
}
