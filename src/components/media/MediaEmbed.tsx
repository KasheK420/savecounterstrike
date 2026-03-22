"use client";

import { ExternalLink } from "lucide-react";

type MediaPlatform = "YOUTUBE" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "TWITCH" | "FACEBOOK" | "OTHER";

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
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        title="Twitch video"
      />
    </div>
  );
}

function TikTokEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="relative w-full max-w-[325px] mx-auto aspect-[9/16] rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        title="TikTok video"
      />
    </div>
  );
}

// ── Official iframe embeds (Instagram, Facebook) ──────────────
// Using official iframe URLs instead of react-social-media-embed for reliability

function InstagramEmbedComponent({ embedUrl }: { embedUrl: string | null }) {
  if (!embedUrl) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Unable to load Instagram embed</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center max-w-[400px] mx-auto">
      <IGEmbed 
        url={url} 
        width={400}
        onError={() => console.error("Instagram embed failed to load")}
      />
    </div>
  );
}

function FacebookEmbedComponent({ embedUrl }: { embedUrl: string | null }) {
  if (!embedUrl) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Unable to load Facebook embed</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center max-w-[500px] mx-auto">
      <FBEmbed 
        url={url} 
        width={500}
        onError={() => console.error("Facebook embed failed to load")}
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

export function MediaEmbed({ url, platform, embedUrl, title }: MediaEmbedProps) {
  switch (platform) {
    case "YOUTUBE":
      return embedUrl ? <YouTubeEmbed embedUrl={embedUrl} /> : <FallbackEmbed url={url} title={title} />;
    case "TWITCH":
      return embedUrl ? <TwitchEmbed embedUrl={embedUrl} /> : <FallbackEmbed url={url} title={title} />;
    case "TIKTOK":
      return embedUrl ? <TikTokEmbed embedUrl={embedUrl} /> : <FallbackEmbed url={url} title={title} />;
    case "INSTAGRAM":
      return <InstagramEmbedComponent embedUrl={embedUrl} />;
    case "FACEBOOK":
      return <FacebookEmbedComponent embedUrl={embedUrl} />;
    default:
      return <FallbackEmbed url={url} title={title} />;
  }
}
