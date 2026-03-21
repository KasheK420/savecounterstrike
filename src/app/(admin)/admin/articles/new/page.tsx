import { ArticleForm } from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          New Article
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Write a new article in Markdown
        </p>
      </div>
      <ArticleForm mode="create" />
    </div>
  );
}
