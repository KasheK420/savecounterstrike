"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { SteamLoginButton } from "@/components/auth/SteamLoginButton";
import { MediaEmbed } from "./MediaEmbed";
import { detectPlatform, getEmbedUrl } from "@/lib/embed";
import { Link2, Send, Eye } from "lucide-react";

const platformLabels: Record<string, string> = {
  YOUTUBE: "YouTube",
  TWITCH: "Twitch",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  TWITTER: "X / Twitter",
  OTHER: "Link",
};

export function MediaSubmitForm() {
  const { user } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const detectedPlatform = url ? detectPlatform(url) : null;
  const embedUrl = url && detectedPlatform ? getEmbedUrl(url, detectedPlatform) : null;

  if (!user) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Sign in via Steam to submit media</p>
        <SteamLoginButton />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !title.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const fieldErrors = data.error;
        if (typeof fieldErrors === "object") {
          setError(Object.values(fieldErrors).flat().join(", "));
        } else {
          setError(fieldErrors || "Failed to submit");
        }
        return;
      }

      const media = await res.json();
      router.push(`/media/${media.id}`);
    } catch {
      setError("Failed to submit media");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Media URL
        </label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or any media link"
            className="w-full rounded-lg border border-border/30 bg-muted/10 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cs-orange/50"
            required
          />
        </div>
        {detectedPlatform && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Detected:</span>
            <span className="px-1.5 py-0.5 rounded bg-muted/30 text-foreground font-medium">
              {platformLabels[detectedPlatform] || detectedPlatform}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your post a title"
          maxLength={200}
          className="w-full rounded-lg border border-border/30 bg-muted/10 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cs-orange/50"
          required
        />
        <span className="text-xs text-muted-foreground">{title.length}/200</span>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add context about this media..."
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border border-border/30 bg-muted/10 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cs-orange/50 resize-none"
        />
        <span className="text-xs text-muted-foreground">{description.length}/1000</span>
      </div>

      {/* Preview */}
      {embedUrl && detectedPlatform && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="h-4 w-4" />
            Preview
          </div>
          <div className="rounded-lg border border-border/20 p-4 bg-muted/5">
            <MediaEmbed
              url={url}
              platform={detectedPlatform}
              embedUrl={embedUrl}
              title={title}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-cs-red">{error}</p>}

      <button
        type="submit"
        disabled={!url.trim() || !title.trim() || submitting}
        className="flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg bg-cs-orange text-black hover:bg-cs-orange-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Submitting..." : "Submit Media"}
      </button>
    </form>
  );
}
