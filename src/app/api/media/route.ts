import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mediaSubmitSchema } from "@/lib/validations";
import { filterProfanity } from "@/lib/profanity";
import { detectPlatform, getEmbedUrl, getThumbnailUrl } from "@/lib/embed";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "hot";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const session = await auth();
  const userId = (session?.user as any)?.userId;
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const where = isAdmin
    ? {}
    : { status: { in: ["APPROVED" as const] } };

  const orderBy =
    sort === "new"
      ? { createdAt: "desc" as const }
      : sort === "top"
        ? { score: "desc" as const }
        : // "hot" — recent + high score
          [{ score: "desc" as const }, { createdAt: "desc" as const }];

  const [media, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy,
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
            faceitLevel: true,
            profileVisibility: true,
          },
        },
        _count: { select: { comments: true, votes: true } },
        ...(userId
          ? {
              votes: {
                where: { userId },
                select: { value: true },
              },
            }
          : {}),
      },
    }),
    db.media.count({ where }),
  ]);

  const items = media.map((m) => ({
    ...m,
    userVote: m.votes?.[0]?.value ?? 0,
    votes: undefined,
  }));

  return NextResponse.json({
    media: items,
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
  const parsed = mediaSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const platform = detectPlatform(parsed.data.url);
  const embedUrl = getEmbedUrl(parsed.data.url, platform);
  const thumbnailUrl = getThumbnailUrl(parsed.data.url, platform);

  const media = await db.media.create({
    data: {
      title: filterProfanity(parsed.data.title),
      description: parsed.data.description
        ? filterProfanity(parsed.data.description)
        : null,
      url: parsed.data.url,
      platform,
      embedUrl,
      thumbnailUrl,
      authorId: userId,
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json(media, { status: 201 });
}
