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

export async function GET(request: NextRequest) {
  const isAdmin = request.headers.get("x-admin") === "true";

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
