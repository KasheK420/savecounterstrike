import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { commentSchema } from "@/lib/validations";
import { sanitizeContent } from "@/lib/sanitize";
import { filterProfanity } from "@/lib/profanity";
import { applyAuthorPrivacy } from "@/lib/mask";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify parent opinion is publicly visible
  const opinion = await db.opinion.findUnique({
    where: { id },
    select: { status: true, authorId: true },
  });
  if (!opinion || opinion.status !== "APPROVED") {
    const session = await auth();
    const userId = session?.user?.userId;
    const isAuthor = userId === opinion?.authorId;
    if (!opinion || !isAuthor) {
      // DB-validated mod/admin check for non-approved content
      const { isModeratorUser } = await import("@/lib/admin");
      const isPrivileged = await isModeratorUser();
      if (!isPrivileged) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
  }

  const comments = await db.comment.findMany({
    where: { opinionId: id, parentId: null },
    orderBy: { score: "desc" },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          ownsCs2: true,
          cs2PlaytimeHours: true,
          faceitLevel: true,
          hidePlaytime: true,
          hideFaceit: true,
          profileVisibility: true,
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              ownsCs2: true,
              cs2PlaytimeHours: true,
              faceitLevel: true,
              profileVisibility: true,
            },
          },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                  cs2PlaytimeHours: true,
                  hidePlaytime: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Mask anonymous authors and apply privacy flags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function maskComment(c: any): any {
    return {
      ...c,
      author: c.isAnonymous
        ? { id: null, displayName: "Anonymous CS2 Player", avatarUrl: null }
        : c.author ? applyAuthorPrivacy(c.author) : c.author,
      replies: c.replies?.map(maskComment) ?? [],
    };
  }

  return NextResponse.json(comments.map(maskComment));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { requireActiveUserApi } = await import("@/lib/admin");
  const userCheck = await requireActiveUserApi();
  if (userCheck.error) return userCheck.response;
  const userId = userCheck.session.user?.userId!;

  const { rateLimitByIp, rateLimitResponse } = await import("@/lib/rate-limit");
  const rl = rateLimitByIp(request, "comment:create", 20, 300_000);
  if (rl.limited) return rateLimitResponse(rl);

  const { id } = await params;

  // Only allow comments on approved opinions
  const opinion = await db.opinion.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!opinion || opinion.status !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = commentSchema.safeParse({ ...body, opinionId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const comment = await db.comment.create({
    data: {
      content: filterProfanity(sanitizeContent(parsed.data.content)),
      authorId: userId,
      opinionId: id,
      parentId: parsed.data.parentId || null,
      isAnonymous: parsed.data.isAnonymous ?? false,
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          cs2PlaytimeHours: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      ...comment,
      author: comment.isAnonymous
        ? { id: null, displayName: "Anonymous CS2 Player", avatarUrl: null }
        : comment.author,
    },
    { status: 201 }
  );
}
