/**
 * @fileoverview Opinions (community posts) API.
 *
 * Handles listing approved opinions with filtering/sorting and creating new posts.
 *
 * @route GET  /api/opinions?sort={best|newest|discussed}&search={query}&page={number}
 * @route POST /api/opinions
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { opinionSchema } from "@/lib/validations";
import { sanitizeContent } from "@/lib/sanitize";
import { filterProfanity } from "@/lib/profanity";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import { applyAuthorPrivacy } from "@/lib/mask";

/**
 * GET /api/opinions
 * List approved opinions with sorting, search, and pagination.
 *
 * Query params:
 * - sort: "best" (score), "newest" (createdAt), "discussed" (comment count)
 * - search: Title search query (max 200 chars)
 * - page: Page number (1-1000, default 1)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "best";
  const search = (searchParams.get("search") || "").trim().slice(0, 200);
  const page = Math.max(1, Math.min(parseInt(searchParams.get("page") || "1", 10) || 1, 1000));
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause for filtering
  const where = {
    status: "APPROVED" as const,
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  // Determine sort order based on sort parameter
  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "discussed"
        ? { comments: { _count: "desc" as const } }
        : { score: "desc" as const }; // Default: "best"

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
            hidePlaytime: true,
            hideFaceit: true,
            profileVisibility: true,
          },
        },
        _count: { select: { comments: true } },
      },
    }),
    db.opinion.count({ where }),
  ]);

  // Apply privacy flags to author data
  const masked = opinions.map((o: typeof opinions[0]) => ({
    ...o,
    author: o.author ? applyAuthorPrivacy(o.author) : o.author,
  }));

  return NextResponse.json({
    opinions: masked,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/opinions
 * Create a new opinion post.
 * Rate limit: 5 posts per 10 minutes per IP.
 *
 * Duplicate detection: If similar titles exist, returns 200 with possibleDuplicates
 * instead of creating. Client can retry with force=true to bypass.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 opinions per 10 minutes per IP
  const rl = rateLimitByIp(request, "opinions:post", 5, 600_000);
  if (rl.limited) return rateLimitResponse(rl);

  const { requireActiveUserApi } = await import("@/lib/admin");
  const userCheck = await requireActiveUserApi();
  if (userCheck.error) return userCheck.response;
  const userId = userCheck.session.user!.userId!;

  const body = await request.json();
  const parsed = opinionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Duplicate title check (unless force flag is set)
  if (!body.force) {
    const similar = await db.opinion.findMany({
      where: {
        title: { contains: parsed.data.title.slice(0, 50), mode: "insensitive" },
        status: "APPROVED",
      },
      take: 5,
      select: { id: true, title: true, score: true },
    });

    if (similar.length > 0) {
      return NextResponse.json(
        { possibleDuplicates: similar },
        { status: 200 }
      );
    }
  }

  // Create opinion with sanitized content and profanity filtering
  const opinion = await db.opinion.create({
    data: {
      title: filterProfanity(parsed.data.title),
      content: sanitizeContent(parsed.data.content),
      imageUrl: parsed.data.imageUrl || null,
      tags: parsed.data.tags || [],
      authorId: userId,
    },
  });

  return NextResponse.json(opinion, { status: 201 });
}
