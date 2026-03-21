import type { Metadata } from "next";
import { db } from "@/lib/db";
import { estimateReadingTime } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Calendar, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "In-depth articles about the cheating epidemic in Counter-Strike 2.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag: tagFilter } = await searchParams;

  const articles = await db.article.findMany({
    where: {
      published: true,
      ...(tagFilter ? { tags: { some: { slug: tagFilter } } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    include: { tags: true },
  });

  // Get all tags for filter pills
  const allTags = await db.tag.findMany({
    where: { articles: { some: { published: true } } },
    orderBy: { name: "asc" },
  });

  const featured = articles.find((a) => a.featured) || articles[0];
  const rest = articles.filter((a) => a.id !== featured?.id);

  if (articles.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="h-16 w-16 text-cs-orange mx-auto mb-6 opacity-50" />
          <h1 className="font-heading text-4xl font-bold mb-4">
            <span className="text-cs-orange">BLOG</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            {tagFilter
              ? "No posts found with this tag. Try removing the filter."
              : "Posts are coming soon. Check back for in-depth coverage of the CS2 anti-cheat situation."}
          </p>
          {tagFilter && (
            <Link
              href="/blog"
              className="inline-block mt-4 text-cs-orange hover:text-cs-orange-light transition-colors"
            >
              Clear filter
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            <span className="text-cs-orange">BLOG</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-3">
            In-depth coverage of the CS2 situation
          </p>
        </div>

        {/* Tag Filter Pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <Link href="/blog">
              <Badge
                variant={!tagFilter ? "default" : "outline"}
                className={
                  !tagFilter
                    ? "bg-cs-orange/20 text-cs-orange border-cs-orange/30 hover:bg-cs-orange/30"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }
              >
                All
              </Badge>
            </Link>
            {allTags.map((tag) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                <Badge
                  variant={tagFilter === tag.slug ? "default" : "outline"}
                  className={
                    tagFilter === tag.slug
                      ? "bg-cs-orange/20 text-cs-orange border-cs-orange/30 hover:bg-cs-orange/30"
                      : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  }
                >
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Featured / Hero Article */}
        {featured && !tagFilter && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-12 rounded-xl overflow-hidden cs-card hover:border-cs-orange/30 transition-all"
          >
            <div className="relative">
              {featured.coverImage ? (
                <div className="relative aspect-[21/9] overflow-hidden">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cs-dark via-cs-dark/60 to-transparent" />
                </div>
              ) : (
                <div className="aspect-[21/9] cs-hero-gradient relative">
                  <div className="absolute inset-0 cs-scanlines opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-cs-dark via-cs-dark/60 to-transparent" />
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                {featured.featured && (
                  <div className="flex items-center gap-1.5 text-cs-gold text-xs font-heading uppercase tracking-wider mb-3">
                    <Star className="h-3.5 w-3.5 fill-cs-gold" />
                    Featured
                  </div>
                )}
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-cs-orange transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-muted-foreground text-sm sm:text-base line-clamp-2 max-w-2xl mb-4">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {featured.publishedAt
                      ? new Date(featured.publishedAt).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )
                      : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {estimateReadingTime(featured.content)} min read
                  </span>
                  {featured.tags.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      {featured.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 rounded-full bg-cs-orange/10 text-cs-orange border border-cs-orange/20 text-[0.65rem]"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Article Grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(tagFilter ? articles : rest).map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group cs-card rounded-xl overflow-hidden hover:border-cs-orange/30 transition-all flex flex-col"
              >
                {/* Card Image */}
                {article.coverImage ? (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cs-navy via-cs-dark to-cs-darker" />
                    <div className="absolute inset-0 cs-scanlines opacity-10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-cs-orange/20" />
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-cs-orange transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                      {article.excerpt}
                    </p>
                  )}
                  {!article.excerpt && <div className="flex-1" />}

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {article.publishedAt
                          ? new Date(
                              article.publishedAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {estimateReadingTime(article.content)}m
                      </span>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded bg-muted/50 text-[0.6rem] text-muted-foreground"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
