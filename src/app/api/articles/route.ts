import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { articleSchema } from "@/lib/validations";

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
      publishedAt: true,
      createdAt: true,
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

  const article = await db.article.create({
    data: {
      ...parsed.data,
      coverImage: parsed.data.coverImage || null,
      publishedAt: parsed.data.published ? new Date() : null,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
