"use client";

import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

type MediaPlatform = "YOUTUBE" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "TWITCH" | "FACEBOOK" | "OTHER";

interface MediaEmbedProps {
  url: string;
  platform: MediaPlatform;
  embedUrl: string | null;
  title?: string;
}

declare global {
  interface Window {
    twttr?: {
      ready: (cb: () => void) => void;
      widgets: {
        load: (el?: HTMLElement) => void;
        createTweet: (id: string, el: HTMLElement, options?: Record<string, string>) => Promise<HTMLElement>;
      };
    };
    instgrm?: { Embeds: { process: () => void } };
  }
}

function loadScript(src: string, id: string, forceReload = false): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.getElementById(id);
    if (existing && forceReload) {
      existing.remove();
    } else if (existing) {
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

function InstagramEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Clear previous embed
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Create blockquote (official Instagram embed method)
    const blockquote = document.createElement("blockquote");
    blockquote.className = "instagram-media";
    blockquote.setAttribute("data-instgrm-permalink", url);
    blockquote.setAttribute("data-instgrm-version", "14");
    blockquote.style.maxWidth = "540px";
    blockquote.style.width = "100%";
    container.appendChild(blockquote);

    // Load embed.js and process — force reload if instgrm is missing (stale script tag)
    const needsReload = !!document.getElementById("instagram-embed-js") && !window.instgrm;
    loadScript("https://www.instagram.com/embed.js", "instagram-embed-js", needsReload).then(() => {
      // Small delay to ensure SDK is initialized
      setTimeout(() => {
        window.instgrm?.Embeds.process();
      }, 100);
    });
  }, [url]);

  return <div ref={ref} className="flex justify-center" />;
}

function TwitterEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Clear previous embed
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Extract tweet ID from URL
    const tweetIdMatch = url.match(/status\/(\d+)/);
    if (!tweetIdMatch) return;

    // Use createTweet API — wait for twttr.ready() to handle async SDK init
    const needsReload = !!document.getElementById("twitter-widgets-js") && !window.twttr;
    loadScript("https://platform.twitter.com/widgets.js", "twitter-widgets-js", needsReload).then(() => {
      const createEmbed = () => {
        window.twttr?.widgets.createTweet(tweetIdMatch[1], container, {
          theme: "dark",
          align: "center",
        });
      };

      if (window.twttr?.ready) {
        window.twttr.ready(createEmbed);
      } else {
        // Fallback: poll for twttr availability
        const interval = setInterval(() => {
          if (window.twttr?.widgets) {
            clearInterval(interval);
            createEmbed();
          }
        }, 100);
        setTimeout(() => clearInterval(interval), 5000);
      }
    });
  }, [url]);

  return <div ref={ref} className="flex justify-center min-h-[200px]" />;
}

function FacebookEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        title="Facebook video"
      />
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
      return <InstagramEmbed url={url} />;
    case "TWITTER":
      return <TwitterEmbed url={url} />;
    case "FACEBOOK":
      return <FacebookEmbed embedUrl={embedUrl!} />;
    default:
      return <FallbackEmbed url={url} title={title} />;
  }
}
