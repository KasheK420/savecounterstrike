"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "./TiptapEditor";
import { Save, Trash2, Eye, Loader2, Star } from "lucide-react";

interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
  featured: boolean;
  tags: string[];
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
      featured: false,
      tags: [],
    }
  );
  const [tagsInput, setTagsInput] = useState(
    initial?.tags?.join(", ") || ""
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

  function handleTagsChange(value: string) {
    setTagsInput(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setData((prev) => ({ ...prev, tags }));
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            URL: /blog/{data.slug || "..."}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tags{" "}
            <span className="text-muted-foreground font-normal">
              (comma separated)
            </span>
          </label>
          <Input
            value={tagsInput}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="anti-cheat, valve, cs2"
            className="bg-muted/50 border-border"
          />
        </div>
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
          placeholder="Brief description for blog cards..."
          rows={2}
          className="bg-muted/50 border-border resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Content</label>
        <TiptapEditor
          content={data.content}
          onChange={(html) => setData((prev) => ({ ...prev, content: html }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Cover Image URL{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
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

        <div className="flex items-end pb-0.5">
          <button
            type="button"
            onClick={() =>
              setData((prev) => ({ ...prev, featured: !prev.featured }))
            }
            className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${
              data.featured
                ? "border-cs-gold/40 bg-cs-gold/10 text-cs-gold"
                : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star
              className={`h-4 w-4 ${data.featured ? "fill-cs-gold" : ""}`}
            />
            Featured Post
          </button>
        </div>
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
