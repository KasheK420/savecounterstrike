"use client";

import { ExternalLink } from "lucide-react";
import { InstagramEmbed } from "react-social-media-embed";

type MediaPlatform = "YOUTUBE" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "TWITCH" | "FACEBOOK" | "OTHER";

const ALLOWED_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.twitch.tv",
  "clips.twitch.tv",
  "www.tiktok.com",
  "www.facebook.com",
]);

/** Validate embed URL to prevent XSS via javascript: or data: URIs */
function sanitizeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (!ALLOWED_EMBED_HOSTS.has(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

interface MediaEmbedProps {
  url: string;
  platform: MediaPlatform;
  embedUrl: string | null;
  title?: string;
}

// ── Iframe-based embeds (YouTube, Twitch, TikTok) ──────────

function YouTubeEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

function TwitchEmbed({ embedUrl }: { embedUrl: string }) {
  const safeUrl = sanitizeEmbedUrl(embedUrl);
  if (!safeUrl) return <FallbackEmbed url={embedUrl} />;
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
      <iframe
        src={safeUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        title="Twitch video"
      />
    </div>
  );
}

function TikTokEmbed({ embedUrl }: { embedUrl: string }) {
  const safeUrl = sanitizeEmbedUrl(embedUrl);
  if (!safeUrl) return <FallbackEmbed url={embedUrl} />;
  return (
    <div className="relative w-full max-w-[325px] mx-auto aspect-[9/16] rounded-lg overflow-hidden">
      <iframe
        src={safeUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        title="TikTok video"
      />
    </div>
  );
}

// ── react-social-media-embed (Instagram) ────────────────────
// Instagram blocks direct iframes since Nov 2025.
// This library handles embed.js SDK internally.

function InstagramEmbedComponent({ url }: { url: string }) {
  return (
    <div className="flex justify-center">
      <InstagramEmbed url={url} width={400} />
    </div>
  );
}

// ── Facebook iframe (still works for public content) ────────

function FacebookEmbedComponent({ embedUrl }: { embedUrl: string | null }) {
  const safeUrl = embedUrl ? sanitizeEmbedUrl(embedUrl) : null;
  if (!safeUrl) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Unable to load Facebook embed</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden max-w-[560px] mx-auto">
      <iframe
        src={safeUrl}
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        title="Facebook post"
      />
    </div>
  );
}

// ── Fallback ────────────────────────────────────────────────

function FallbackEmbed({ url, title }: { url: string; title?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-lg border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors"
    >
      <ExternalLink className="h-8 w-8 text-cs-blue shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {title || url}
        </p>
        <p className="text-xs text-muted-foreground truncate">{url}</p>
      </div>
    </a>
  );
}

// ── Main component ──────────────────────────────────────────
// Note: Twitter is rendered server-side in media/[id]/page.tsx via react-tweet

export function MediaEmbed({ url, platform, embedUrl, title }: MediaEmbedProps) {
  switch (platform) {
    case "YOUTUBE":
      return embedUrl ? <YouTubeEmbed embedUrl={embedUrl} /> : <FallbackEmbed url={url} title={title} />;
    case "TWITCH":
      return embedUrl ? <TwitchEmbed embedUrl={embedUrl} /> : <FallbackEmbed url={url} title={title} />;
    case "TIKTOK":
      return embedUrl ? <TikTokEmbed embedUrl={embedUrl} /> : <FallbackEmbed url={url} title={title} />;
    case "INSTAGRAM":
      return <InstagramEmbedComponent url={url} />;
    case "FACEBOOK":
      return <FacebookEmbedComponent embedUrl={embedUrl} />;
    default:
      return <FallbackEmbed url={url} title={title} />;
  }
}
