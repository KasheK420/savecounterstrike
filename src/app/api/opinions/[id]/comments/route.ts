import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { commentSchema } from "@/lib/validations";
import { sanitizeContent } from "@/lib/sanitize";
import { filterProfanity } from "@/lib/profanity";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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

  return NextResponse.json(comment, { status: 201 });
}
