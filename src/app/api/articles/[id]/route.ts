import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { articleSchema } from "@/lib/validations";

function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Unpublished articles only visible to admins
  if (!article.published) {
    const result = await requireAdminApi();
    if (result.error) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = articleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await db.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check slug uniqueness if changed
  if (parsed.data.slug !== existing.slug) {
    const slugTaken = await db.article.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (slugTaken) {
      return NextResponse.json(
        { error: "An article with this slug already exists" },
        { status: 409 }
      );
    }
  }

  const wasPublished = existing.published;
  const { tags: tagNames, ...articleData } = parsed.data;

  const article = await db.article.update({
    where: { id },
    data: {
      ...articleData,
      coverImage: articleData.coverImage || null,
      publishedAt:
        articleData.published && !wasPublished
          ? new Date()
          : articleData.published
            ? existing.publishedAt
            : null,
      tags: {
        set: [],
        connectOrCreate: tagNames.map((name) => ({
          where: { slug: slugifyTag(name) },
          create: { name, slug: slugifyTag(name) },
        })),
      },
    },
    include: { tags: true },
  });

  return NextResponse.json(article);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const { id } = await params;
  await db.article.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
