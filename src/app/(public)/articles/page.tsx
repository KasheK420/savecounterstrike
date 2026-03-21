import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { FileText, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Articles",
  description: "Articles about the cheating epidemic in Counter-Strike 2.",
};

export default async function ArticlesPage() {
  const articles = await db.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  if (articles.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="h-16 w-16 text-cs-orange mx-auto mb-6 opacity-50" />
          <h1 className="font-heading text-4xl font-bold mb-4">
            <span className="text-cs-orange">ARTICLES</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Articles are coming soon. Check back for in-depth coverage of the
            CS2 anti-cheat situation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl font-bold">
            <span className="text-cs-orange">ARTICLES</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-3">
            In-depth coverage of the CS2 situation
          </p>
        </div>

        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="cs-card rounded-lg p-6 block hover:border-cs-orange/20 transition-all"
            >
              <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                  {article.excerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Draft"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
