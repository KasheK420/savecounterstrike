import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!article) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Edit Article
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          /{article.slug}
        </p>
      </div>
      <ArticleForm
        mode="edit"
        initial={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || "",
          content: article.content,
          coverImage: article.coverImage || "",
          published: article.published,
          featured: article.featured,
          tags: article.tags.map((t) => t.name),
        }}
      />
    </div>
  );
}
