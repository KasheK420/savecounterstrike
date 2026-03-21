"use client";

import { ExternalLink } from "lucide-react";
import { Tweet } from "react-tweet";
import {
  InstagramEmbed as IGEmbed,
  FacebookEmbed as FBEmbed,
} from "react-social-media-embed";

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

// ── Library-based embeds (Twitter, Instagram, Facebook) ─────

function TwitterEmbed({ url }: { url: string }) {
  const tweetId = url.match(/status\/(\d+)/)?.[1];
  if (!tweetId) return <FallbackEmbed url={url} />;

  return (
    <div className="flex justify-center [&_.react-tweet-theme]:!bg-transparent">
      <Tweet id={tweetId} />
    </div>
  );
}

function InstagramEmbedComponent({ url }: { url: string }) {
  return (
    <div className="flex justify-center">
      <IGEmbed url={url} width={400} />
    </div>
  );
}

function FacebookEmbedComponent({ url }: { url: string }) {
  return (
    <div className="flex justify-center">
      <FBEmbed url={url} width={560} />
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
    case "TWITTER":
      return <TwitterEmbed url={url} />;
    case "INSTAGRAM":
      return <InstagramEmbedComponent url={url} />;
    case "FACEBOOK":
      return <FacebookEmbedComponent url={url} />;
    default:
      return <FallbackEmbed url={url} title={title} />;
  }
}
