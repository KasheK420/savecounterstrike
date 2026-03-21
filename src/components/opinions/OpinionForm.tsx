"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { RichTextEditor } from "./RichTextEditor";
import { SafeHtml } from "./SafeHtml";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Send, Loader2, Eye, Edit3 } from "lucide-react";

export function OpinionForm() {
  const { user } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="cs-card rounded-lg p-6 text-center">
        <p className="text-muted-foreground mb-3">
          Sign in with Steam to share your opinion.
        </p>
        <a
          href="/api/auth/steam/login"
          className="text-cs-orange hover:text-cs-orange-light text-sm"
        >
          Sign in via Steam &rarr;
        </a>
      </div>
    );
  }

  async function handleSubmit() {
    if (!title.trim() || content.length < 10) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/opinions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          imageUrl: imageUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to submit opinion"
        );
      }

      const opinion = await res.json();
      router.push(`/opinions/${opinion.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cs-card rounded-lg p-6 space-y-4">
      <h3 className="font-heading font-semibold text-foreground">
        Share Your Opinion
      </h3>

      {error && (
        <div className="p-3 rounded bg-cs-red/10 border border-cs-red/20 text-cs-red text-sm">
          {error}
        </div>
      )}

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title — what's your suggestion or concern?"
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
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Describe your opinion, suggestion, or what needs to change..."
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Be constructive. Your opinion shapes the open letter to Valve.
        </p>
        <Button
          onClick={handleSubmit}
          disabled={saving || !title.trim() || content.length < 10}
          className="bg-cs-orange hover:bg-cs-orange-light text-background font-heading"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit
        </Button>
      </div>
    </div>
  );
}
