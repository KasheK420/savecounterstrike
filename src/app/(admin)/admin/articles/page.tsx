import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, FileText, Eye, EyeOff, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArticleActions } from "@/components/admin/ArticleActions";

export default async function AdminArticlesPage() {
  const articles = await db.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Blog Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {articles.length} post{articles.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className={cn(
            buttonVariants({ size: "default" }),
            "bg-cs-orange hover:bg-cs-orange-light text-background font-heading"
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="cs-card rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No blog posts yet.</p>
          <Link
            href="/admin/articles/new"
            className="text-cs-orange hover:text-cs-orange-light text-sm mt-2 inline-block"
          >
            Write your first post &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article: typeof articles[0]) => (
            <Link
              key={article.id}
              href={`/admin/articles/${article.id}`}
              className="cs-card rounded-lg p-4 flex items-center justify-between hover:border-cs-orange/20 transition-all block"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {article.featured && (
                    <Star className="h-4 w-4 text-cs-gold fill-cs-gold shrink-0" />
                  )}
                  <h3 className="font-semibold text-foreground truncate">
                    {article.title}
                  </h3>
                  {article.published ? (
                    <Badge
                      variant="outline"
                      className="border-cs-green/30 text-cs-green text-xs shrink-0"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/30 text-muted-foreground text-xs shrink-0"
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    /{article.slug} &middot;{" "}
                    {new Date(article.createdAt).toLocaleDateString()}
                  </p>
                  {article.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      {article.tags.map((tag: typeof article.tags[0]) => (
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
              <ArticleActions
                articleId={article.id}
                published={article.published}
                title={article.title}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
