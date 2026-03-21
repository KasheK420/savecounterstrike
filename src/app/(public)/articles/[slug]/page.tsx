import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findUnique({ where: { slug } });
  if (!article || !article.published) return { title: "Article Not Found" };

  return {
    title: article.title,
    description: article.excerpt || undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await db.article.findUnique({ where: { slug } });

  if (!article || !article.published) notFound();

  return (
    <div className="min-h-screen py-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          All Articles
        </Link>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
          {article.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Calendar className="h-4 w-4" />
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </div>

        <div className="prose prose-invert prose-orange max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-heading prose-strong:text-foreground prose-a:text-cs-orange prose-a:no-underline hover:prose-a:underline prose-code:text-cs-orange prose-blockquote:border-cs-orange/30">
          <Markdown remarkPlugins={[remarkGfm]}>{article.content}</Markdown>
        </div>
      </article>
    </div>
  );
}
