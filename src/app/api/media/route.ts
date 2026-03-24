/**
 * @fileoverview Media (video clips, screenshots) API.
 *
 * Handles listing media items with voting status and submitting new media.
 *
 * @route GET  /api/media?sort={hot|new|top}&page={number}
 * @route POST /api/media
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { mediaSubmitSchema } from "@/lib/validations";
import { filterProfanity } from "@/lib/profanity";
import { detectPlatform, getEmbedUrl, getThumbnailUrl } from "@/lib/embed";

/**
 * GET /api/media
 * List media items with sorting and pagination.
 * Admins see all content; regular users see only APPROVED.
 * Includes current user's vote status if authenticated.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "hot";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const session = await auth();
  const userId = session?.user?.userId;
  const isAdmin = await isAdminUser();

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

  const items = media.map((m: typeof media[0]) => ({
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

/**
 * POST /api/media
 * Submit new media content.
 * Rate limit: 5 submissions per hour per IP.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 submissions per hour per IP
  const { rateLimitByIp, rateLimitResponse } = await import("@/lib/rate-limit");
  const rl = rateLimitByIp(request, "media:create", 5, 3600_000);
  if (rl.limited) return rateLimitResponse(rl);

  const body = await request.json();
  const parsed = mediaSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate URL
  const existing = await db.media.findFirst({
    where: { url: parsed.data.url },
    select: { id: true, title: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: "This media has already been submitted.",
        existingId: existing.id,
        existingTitle: existing.title,
      },
      { status: 409 }
    );
  }

  // Extract platform info and generate embed/thumbnail URLs
  const platform = detectPlatform(parsed.data.url);
  const embedUrl = getEmbedUrl(parsed.data.url, platform);
  let thumbnailUrl = getThumbnailUrl(parsed.data.url, platform);

  // For Twitter, fetch actual thumbnail from tweet data
  if (platform === "TWITTER" && !thumbnailUrl) {
    try {
      const { getTweet } = await import("react-tweet/api");
      const tweetId = parsed.data.url.match(/status\/(\d+)/)?.[1];
      if (tweetId) {
        const tweet = await getTweet(tweetId);
        thumbnailUrl = tweet?.video?.poster
          || tweet?.mediaDetails?.[0]?.media_url_https
          || tweet?.user?.profile_image_url_https?.replace("_normal", "_bigger")
          || null;
      }
    } catch {
      // Non-fatal — proceed without thumbnail
    }
  }

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
      tags: parsed.data.tags,
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
