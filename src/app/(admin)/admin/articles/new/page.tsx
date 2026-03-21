import { ArticleForm } from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          New Blog Post
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new blog post with the rich text editor
        </p>
      </div>
      <ArticleForm mode="create" />
    </div>
  );
}
