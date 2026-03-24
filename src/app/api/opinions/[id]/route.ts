import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdminApi, requireModeratorApi } from "@/lib/admin";
import { opinionSchema } from "@/lib/validations";
import { sanitizeContent } from "@/lib/sanitize";
import { filterProfanity } from "@/lib/profanity";
import { applyAuthorPrivacy } from "@/lib/mask";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.userId;

  const { id } = await params;
  const opinion = await db.opinion.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          ownsCs2: true,
          cs2PlaytimeHours: true,
          cs2Wins: true,
          faceitLevel: true,
          hidePlaytime: true,
          hideFaceit: true,
          profileVisibility: true,
        },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!opinion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Non-approved opinions only visible to author, moderators, and admins (DB-validated)
  if (opinion.status !== "APPROVED") {
    const isAuthor = userId === opinion.authorId;
    if (!isAuthor) {
      const { isModeratorUser } = await import("@/lib/admin");
      const isPrivileged = await isModeratorUser();
      if (!isPrivileged) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
  }

  return NextResponse.json({
    ...opinion,
    author: opinion.author ? applyAuthorPrivacy(opinion.author) : opinion.author,
  });
}

// PUT — User edits their own opinion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { requireActiveUserApi } = await import("@/lib/admin");
  const userCheck = await requireActiveUserApi();
  if (userCheck.error) return userCheck.response;
  const userId = userCheck.session.user?.userId!;

  const { id } = await params;
  const opinion = await db.opinion.findUnique({ where: { id } });

  if (!opinion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (opinion.authorId !== userId) {
    return NextResponse.json(
      { error: "You can only edit your own opinions" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = opinionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await db.opinion.update({
    where: { id },
    data: {
      title: filterProfanity(parsed.data.title),
      content: sanitizeContent(parsed.data.content),
      imageUrl: parsed.data.imageUrl || null,
      editedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

// PATCH — Moderator/Admin changes status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireModeratorApi();
  if (result.error) return result.response;

  const { id } = await params;
  const body = await request.json();
  const status = body.status;

  if (!["APPROVED", "REJECTED", "HIDDEN"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be APPROVED, REJECTED, or HIDDEN" },
      { status: 400 }
    );
  }

  const opinion = await db.opinion.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(opinion);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireModeratorApi();
  if (result.error) return result.response;

  const { id } = await params;
  await db.opinion.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
