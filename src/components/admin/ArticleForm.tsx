"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash2, Eye, Loader2 } from "lucide-react";

interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
}

interface ArticleFormProps {
  initial?: ArticleData;
  mode: "create" | "edit";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export function ArticleForm({ initial, mode }: ArticleFormProps) {
  const router = useRouter();
  const [data, setData] = useState<ArticleData>(
    initial || {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      published: false,
    }
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [autoSlug, setAutoSlug] = useState(!initial);

  function handleTitleChange(title: string) {
    setData((prev) => ({
      ...prev,
      title,
      ...(autoSlug ? { slug: slugify(title) } : {}),
    }));
  }

  async function handleSave(publish?: boolean) {
    setSaving(true);
    setError("");

    const body = {
      ...data,
      published: publish !== undefined ? publish : data.published,
      coverImage: data.coverImage || undefined,
    };

    try {
      const url =
        mode === "create"
          ? "/api/articles"
          : `/api/articles/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      router.push("/admin/articles");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this article?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${initial?.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/articles");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-3 rounded-md bg-cs-red/10 border border-cs-red/20 text-cs-red text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Title</label>
        <Input
          value={data.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Article title..."
          className="bg-muted/50 border-border"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Slug</label>
        <Input
          value={data.slug}
          onChange={(e) => {
            setAutoSlug(false);
            setData((prev) => ({ ...prev, slug: e.target.value }));
          }}
          placeholder="article-slug"
          className="bg-muted/50 border-border font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          URL: /articles/{data.slug || "..."}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Excerpt{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Textarea
          value={data.excerpt}
          onChange={(e) =>
            setData((prev) => ({ ...prev, excerpt: e.target.value }))
          }
          placeholder="Brief description for article cards..."
          rows={2}
          className="bg-muted/50 border-border resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Content{" "}
          <span className="text-muted-foreground font-normal">(Markdown)</span>
        </label>
        <Textarea
          value={data.content}
          onChange={(e) =>
            setData((prev) => ({ ...prev, content: e.target.value }))
          }
          placeholder="Write your article in Markdown..."
          rows={20}
          className="bg-muted/50 border-border font-mono text-sm resize-y"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Cover Image URL{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          value={data.coverImage}
          onChange={(e) =>
            setData((prev) => ({ ...prev, coverImage: e.target.value }))
          }
          placeholder="https://..."
          className="bg-muted/50 border-border"
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border/30">
        <Button
          onClick={() => handleSave()}
          disabled={saving || !data.title || !data.slug || !data.content}
          className="bg-cs-orange hover:bg-cs-orange-light text-background font-heading"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save {data.published ? "" : "Draft"}
        </Button>

        {!data.published && (
          <Button
            onClick={() => handleSave(true)}
            disabled={saving || !data.title || !data.slug || !data.content}
            variant="outline"
            className="border-cs-green/30 text-cs-green hover:bg-cs-green/10"
          >
            <Eye className="h-4 w-4 mr-2" />
            Publish
          </Button>
        )}

        {data.published && (
          <Button
            onClick={() => handleSave(false)}
            disabled={saving}
            variant="outline"
            className="border-muted-foreground/30"
          >
            Unpublish
          </Button>
        )}

        {mode === "edit" && (
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="outline"
            className="border-cs-red/30 text-cs-red hover:bg-cs-red/10 ml-auto"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
