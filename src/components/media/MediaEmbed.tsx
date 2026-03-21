"use client";

import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

type MediaPlatform = "YOUTUBE" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "TWITCH" | "OTHER";

interface MediaEmbedProps {
  url: string;
  platform: MediaPlatform;
  embedUrl: string | null;
  title?: string;
}

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
    instgrm?: { Embeds: { process: () => void } };
  }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

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

function InstagramEmbed({ embedUrl }: { embedUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadScript("https://www.instagram.com/embed.js", "instagram-embed-js").then(() => {
      window.instgrm?.Embeds.process();
    });
  }, [embedUrl]);

  return (
    <div ref={ref} className="flex justify-center">
      <iframe
        src={embedUrl}
        className="rounded-lg border border-border/20"
        width="400"
        height="500"
        allowFullScreen
        title="Instagram post"
      />
    </div>
  );
}

function TwitterEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadScript("https://platform.twitter.com/widgets.js", "twitter-widgets-js").then(() => {
      if (ref.current) {
        window.twttr?.widgets.load(ref.current);
      }
    });
  }, [url]);

  return (
    <div ref={ref} className="flex justify-center">
      <blockquote className="twitter-tweet" data-theme="dark">
        <a href={url}>{url}</a>
      </blockquote>
    </div>
  );
}

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

export function MediaEmbed({ url, platform, embedUrl, title }: MediaEmbedProps) {
  if (!embedUrl && platform !== "OTHER") {
    return <FallbackEmbed url={url} title={title} />;
  }

  switch (platform) {
    case "YOUTUBE":
      return <YouTubeEmbed embedUrl={embedUrl!} />;
    case "TWITCH":
      return <TwitchEmbed embedUrl={embedUrl!} />;
    case "TIKTOK":
      return <TikTokEmbed embedUrl={embedUrl!} />;
    case "INSTAGRAM":
      return <InstagramEmbed embedUrl={embedUrl!} />;
    case "TWITTER":
      return <TwitterEmbed url={url} />;
    default:
      return <FallbackEmbed url={url} title={title} />;
  }
}
