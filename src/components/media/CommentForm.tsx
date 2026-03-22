"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { SteamLoginButton } from "@/components/auth/SteamLoginButton";
import { EyeOff, Send } from "lucide-react";

interface CommentFormProps {
  mediaId: string;
  parentId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (comment: any) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  mediaId,
  parentId,
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
}: CommentFormProps) {
  const { user } = useSession();
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border/20 bg-muted/10">
        <p className="text-sm text-muted-foreground">Sign in to comment</p>
        <SteamLoginButton />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/media/${mediaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || undefined,
          isAnonymous,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to post comment");
        return;
      }

      const comment = await res.json();
      onSubmit(comment);
      setContent("");
      setIsAnonymous(false);
    } catch {
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        rows={parentId ? 2 : 3}
        className="w-full rounded-lg border border-border/30 bg-muted/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cs-orange/50 resize-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-border/50"
            />
            <EyeOff className="h-3 w-3" />
            Anonymous
          </label>
          <span className="text-xs text-muted-foreground">
            {content.length}/2000
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-cs-orange text-black hover:bg-cs-orange-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3 w-3" />
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-cs-red">{error}</p>
      )}
    </form>
  );
}
