import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { opinionSchema } from "@/lib/validations";
import { sanitizeContent } from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "best";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    status: "APPROVED" as const,
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "discussed"
        ? { comments: { _count: "desc" as const } }
        : { score: "desc" as const };

  const [opinions, total] = await Promise.all([
    db.opinion.findMany({
      where,
      orderBy: sort === "discussed" ? { comments: { _count: "desc" } } : orderBy,
      skip,
      take: limit,
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
            profileVisibility: true,
          },
        },
        _count: { select: { comments: true } },
      },
    }),
    db.opinion.count({ where }),
  ]);

  return NextResponse.json({
    opinions,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = opinionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const opinion = await db.opinion.create({
    data: {
      title: parsed.data.title,
      content: sanitizeContent(parsed.data.content),
      imageUrl: parsed.data.imageUrl || null,
      authorId: userId,
    },
  });

  return NextResponse.json(opinion, { status: 201 });
}
