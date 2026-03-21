import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { estimateReadingTime } from "@/lib/utils";
import { ArticleContent } from "@/components/blog/ArticleContent";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowLeft, Clock, Share2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findUnique({ where: { slug } });
  if (!article || !article.published) return { title: "Post Not Found" };

  return {
    title: article.title,
    description: article.excerpt || undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    include: { tags: true },
  });

  if (!article || !article.published) notFound();

  const readingTime = estimateReadingTime(article.content);
  const shareUrl = `/blog/${article.slug}`;

  return (
    <div className="min-h-screen">
      {/* Cover Image Hero */}
      {article.coverImage && (
        <div className="relative w-full aspect-[21/9] max-h-[400px] overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cs-dark/40 to-cs-dark" />
        </div>
      )}

      <article
        className={`mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 ${
          article.coverImage ? "-mt-20 relative z-10" : "pt-16"
        }`}
      >
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Title */}
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
          {article.title}
        </h1>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {readingTime} min read
          </span>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                <Badge
                  variant="outline"
                  className="border-cs-orange/20 text-cs-orange/80 hover:bg-cs-orange/10 hover:text-cs-orange transition-colors"
                >
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-border/30 mb-8" />

        {/* Article Content */}
        <ArticleContent html={article.content} />

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Share2 className="h-4 w-4" />
            <span className="font-heading uppercase tracking-wider text-xs">
              Share
            </span>
            <a
              href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border/50 hover:border-cs-orange/30 hover:text-cs-orange transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              X
            </a>
            <a
              href={`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border/50 hover:border-cs-orange/30 hover:text-cs-orange transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Reddit
            </a>
          </div>
        </div>

        {/* Back to Blog (bottom) */}
        <div className="mt-8 pb-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </article>
    </div>
  );
}
