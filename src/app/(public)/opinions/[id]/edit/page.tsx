"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { SharedTiptapEditor } from "@/components/shared/TiptapEditor";
import { SafeHtml } from "@/components/opinions/SafeHtml";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Eye, Edit3, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditOpinionPage() {
  const { user } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOpinion() {
      try {
        const res = await fetch(`/api/opinions/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setTitle(data.title);
        setContent(data.content);
        setImageUrl(data.imageUrl || "");
      } catch {
        setError("Opinion not found");
      } finally {
        setLoading(false);
      }
    }
    fetchOpinion();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/opinions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl: imageUrl || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to save"
        );
      }
      router.push(`/opinions/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen py-16 text-center">
        <p className="text-muted-foreground">Sign in to edit opinions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cs-orange mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href={`/opinions/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Opinion
        </Link>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
          Edit <span className="text-cs-orange">Opinion</span>
        </h1>

        {error && (
          <div className="p-3 rounded-md bg-cs-red/10 border border-cs-red/20 text-cs-red text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="bg-muted/50 border-border"
            maxLength={200}
          />

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Preview Image (optional)"
          />

          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreview(false)}
              className={!preview ? "text-cs-orange" : "text-muted-foreground"}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreview(true)}
              className={preview ? "text-cs-orange" : "text-muted-foreground"}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
          </div>

          {preview ? (
            <SafeHtml
              html={content}
              className="min-h-[200px] p-4 border border-border rounded-lg prose prose-invert prose-sm max-w-none prose-headings:font-heading prose-a:text-cs-orange"
            />
          ) : (
            <SharedTiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Edit your opinion..."
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim() || content.length < 10}
              className="bg-cs-orange hover:bg-cs-orange-light text-background font-heading"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
