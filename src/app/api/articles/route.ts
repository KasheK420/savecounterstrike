/**
 * @fileoverview Blog articles API (admin only for writes).
 *
 * Public read access for published articles; admin access for all.
 * Handles article CRUD and tag management.
 *
 * @route GET  /api/articles          - List articles (public sees published only)
 * @route POST /api/articles          - Create article (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAdminApi } from "@/lib/admin";
import { articleSchema } from "@/lib/validations";

/**
 * Convert tag name to URL-friendly slug.
 * Lowercases, replaces non-alphanumeric with hyphens, trims edges.
 */
function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * GET /api/articles
 * List all articles. Public users see only published articles.
 * Admins see all articles including drafts.
 */
export async function GET() {
  const adminSession = await requireAdmin();
  const isAdmin = !!adminSession;

  const articles = await db.article.findMany({
    where: isAdmin ? {} : { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      published: true,
      featured: true,
      publishedAt: true,
      createdAt: true,
      tags: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(articles);
}

/**
 * POST /api/articles
 * Create new blog article with tags. Admin only.
 * Auto-creates tags if they don't exist (connectOrCreate).
 */
export async function POST(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const body = await request.json();
  const parsed = articleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate slug
  const existing = await db.article.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An article with this slug already exists" },
      { status: 409 }
    );
  }

  const { tags: tagNames, ...articleData } = parsed.data;

  // Create article with tag connections
  const article = await db.article.create({
    data: {
      ...articleData,
      coverImage: articleData.coverImage || null,
      publishedAt: articleData.published ? new Date() : null,
      tags: {
        connectOrCreate: tagNames.map((name) => ({
          where: { slug: slugifyTag(name) },
          create: { name, slug: slugifyTag(name) },
        })),
      },
    },
    include: { tags: true },
  });

  return NextResponse.json(article, { status: 201 });
}
