import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sanitizeContent } from "@/lib/sanitize";
import { filterProfanity } from "@/lib/profanity";
import { applyAuthorPrivacy } from "@/lib/mask";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
  ownsCs2: true,
  cs2PlaytimeHours: true,
  faceitLevel: true,
  hidePlaytime: true,
  hideFaceit: true,
  profileVisibility: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.userId;

  // Verify parent media is approved (or requester is admin)
  const { isAdminUser } = await import("@/lib/admin");
  const isAdmin = await isAdminUser();
  const media = await db.media.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!media || (!isAdmin && media.status !== "APPROVED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comments = await db.comment.findMany({
    where: { mediaId: id, parentId: null },
    orderBy: { score: "desc" },
    include: {
      author: { select: AUTHOR_SELECT },
      votes: userId ? { where: { userId }, select: { value: true } } : false,
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: AUTHOR_SELECT },
          votes: userId ? { where: { userId }, select: { value: true } } : false,
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: AUTHOR_SELECT },
              votes: userId ? { where: { userId }, select: { value: true } } : false,
            },
          },
        },
      },
    },
  });

  // Mask anonymous authors (unless admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function maskComment(c: any) {
    const userVote = c.votes?.[0]?.value ?? 0;
    const masked = {
      ...c,
      userVote,
      votes: undefined,
      author: c.isAnonymous && !isAdmin
        ? { id: null, displayName: "Anonymous CS2 Player", avatarUrl: null }
        : c.author ? applyAuthorPrivacy(c.author) : c.author,
      replies: c.replies?.map(maskComment) ?? [],
    };
    return masked;
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
  const rl = rateLimitByIp(request, "comment:create", 20, 300_000); // 20 per 5 min
  if (rl.limited) return rateLimitResponse(rl);

  const { id } = await params;
  const body = await request.json();

  const content = body.content;
  const parentId = body.parentId || null;
  const isAnonymous = body.isAnonymous === true;

  if (!content || typeof content !== "string" || content.length < 1 || content.length > 2000) {
    return NextResponse.json(
      { error: "Content must be 1-2000 characters" },
      { status: 400 }
    );
  }

  // Verify media exists and is approved
  const media = await db.media.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!media || media.status !== "APPROVED") {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // Verify parent comment if replying
  if (parentId) {
    const parent = await db.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.mediaId !== id) {
      return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
    }
  }

  const comment = await db.comment.create({
    data: {
      content: sanitizeContent(filterProfanity(content)),
      authorId: userId,
      mediaId: id,
      parentId,
      isAnonymous,
    },
    include: {
      author: { select: AUTHOR_SELECT },
    },
  });

  return NextResponse.json(
    {
      ...comment,
      userVote: 0,
      author: isAnonymous
        ? { id: null, displayName: "Anonymous CS2 Player", avatarUrl: null }
        : comment.author,
      replies: [],
    },
    { status: 201 }
  );
}
