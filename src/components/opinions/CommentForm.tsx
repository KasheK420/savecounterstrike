"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface CommentFormProps {
  opinionId: string;
  parentId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmitted?: (comment: any) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  opinionId,
  parentId,
  onSubmitted,
  onCancel,
  placeholder = "Add a comment...",
}: CommentFormProps) {
  const { user } = useSession();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <p className="text-xs text-muted-foreground">
        <a
          href="/api/auth/steam/login"
          className="text-cs-orange hover:text-cs-orange-light"
        >
          Sign in
        </a>{" "}
        to comment.
      </p>
    );
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/opinions/${opinionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          parentId,
        }),
      });

      if (res.ok) {
        const comment = await res.json();
        setContent("");
        onSubmitted?.(comment);
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        className="bg-muted/30 border-border resize-none text-sm"
        maxLength={2000}
      />
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={saving || !content.trim()}
          size="sm"
          className="bg-cs-orange hover:bg-cs-orange-light text-background text-xs"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Send className="h-3 w-3 mr-1" />
          )}
          {parentId ? "Reply" : "Comment"}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="ghost" size="sm" className="text-xs">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
