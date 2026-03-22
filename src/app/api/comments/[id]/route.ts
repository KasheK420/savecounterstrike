import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModeratorApi } from "@/lib/admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireModeratorApi();
  if (result.error) return result.response;

  const { id } = await params;
  await db.comment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
