import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE_URL = "https://savecounterstrike.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/petition",
    "/blog",
    "/media",
    "/opinions",
    "/stats",
    "/revenue",
    "/about",
    "/support",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : route === "/petition" ? 0.9 : 0.7,
  }));

  // Published articles
  const articles = await db.article.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const articleRoutes = articles.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Opinions
  const opinions = await db.opinion.findMany({
    where: { status: "APPROVED" },
    select: { id: true, updatedAt: true },
    take: 500,
    orderBy: { score: "desc" },
  });

  const opinionRoutes = opinions.map((opinion) => ({
    url: `${BASE_URL}/opinions/${opinion.id}`,
    lastModified: opinion.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...opinionRoutes];
}
