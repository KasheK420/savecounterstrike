"use client";

import { useEffect, useRef } from "react";
import sanitizeHtml from "sanitize-html";

// Extend window for embed script globals
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

// Strict sanitization config — only allows safe HTML from the Tiptap editor.
// Content is admin-only (requires ADMIN role), so XSS risk is minimal,
// but we sanitize anyway as defense-in-depth.
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "iframe",
    "div",
    "span",
    "h1",
    "h2",
    "h3",
    "figure",
    "figcaption",
    "u",
    "s",
    "del",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    iframe: [
      "src",
      "width",
      "height",
      "frameborder",
      "allow",
      "allowfullscreen",
      "title",
    ],
    div: ["data-twitter-embed", "data-instagram-embed", "class", "data-youtube-video"],
    img: ["src", "alt", "width", "height", "class"],
    a: ["href", "target", "rel"],
  },
  allowedIframeHostnames: [
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "player.twitch.tv",
  ],
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function ArticleContent({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sanitized = sanitizeHtml(html, sanitizeOptions);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Hydrate Twitter embeds
    const twitterEmbeds = el.querySelectorAll<HTMLElement>(
      "[data-twitter-embed]"
    );
    if (twitterEmbeds.length > 0) {
      twitterEmbeds.forEach((node) => {
        const url = node.getAttribute("data-twitter-embed");
        if (!url || node.querySelector("blockquote")) return;

        // Clear placeholder text
        node.innerHTML = "";
        node.className = "twitter-embed-container my-4";

        const blockquote = document.createElement("blockquote");
        blockquote.className = "twitter-tweet";
        blockquote.setAttribute("data-theme", "dark");
        const a = document.createElement("a");
        a.href = url;
        blockquote.appendChild(a);
        node.appendChild(blockquote);
      });

      loadScript("https://platform.twitter.com/widgets.js").then(() => {
        window.twttr?.widgets.load(el);
      });
    }

    // Hydrate Instagram embeds
    const instagramEmbeds = el.querySelectorAll<HTMLElement>(
      "[data-instagram-embed]"
    );
    if (instagramEmbeds.length > 0) {
      instagramEmbeds.forEach((node) => {
        const url = node.getAttribute("data-instagram-embed");
        if (!url || node.querySelector("blockquote")) return;

        node.innerHTML = "";
        node.className = "instagram-embed-container my-4";

        const blockquote = document.createElement("blockquote");
        blockquote.className = "instagram-media";
        blockquote.setAttribute("data-instgrm-captioned", "");
        blockquote.setAttribute("data-instgrm-permalink", url);
        blockquote.style.maxWidth = "540px";
        blockquote.style.width = "100%";
        node.appendChild(blockquote);
      });

      loadScript("https://www.instagram.com/embed.js").then(() => {
        window.instgrm?.Embeds.process();
      });
    }
  }, [sanitized]);

  return (
    <div
      ref={containerRef}
      className="prose prose-invert prose-orange max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-heading prose-strong:text-foreground prose-a:text-cs-orange prose-a:no-underline hover:prose-a:underline prose-code:text-cs-orange prose-blockquote:border-cs-orange/30 prose-img:rounded-lg prose-hr:border-border/50"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
