import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { articleSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const article = await db.article.update({
    where: { id },
    data: {
      ...parsed.data,
      coverImage: parsed.data.coverImage || null,
      publishedAt:
        parsed.data.published && !wasPublished
          ? new Date()
          : parsed.data.published
            ? existing.publishedAt
            : null,
    },
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
