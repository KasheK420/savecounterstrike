"use client";

import { useEffect, useRef, useState } from "react";

interface TwitterEmbedProps {
  tweetUrl: string;
}

/**
 * Twitter/X embed using widgets.js createTweet API.
 *
 * Uses twttr.widgets.createTweet() which dynamically creates the embed
 * inside a specific DOM element — avoids React hydration conflicts that
 * happen with the blockquote + load() approach.
 */
export function TwitterEmbed({ tweetUrl }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];

  useEffect(() => {
    if (!tweetId || !containerRef.current) return;

    const container = containerRef.current;
    let cancelled = false;

    function createEmbed() {
      if (cancelled || !container) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const twttr = (window as any).twttr;
      if (!twttr?.widgets?.createTweet) return;

      // Clear container and create tweet embed
      container.textContent = "";
      twttr.widgets.createTweet(tweetId, container, {
        theme: "dark",
        align: "center",
        conversation: "none",
      }).then(() => {
        if (!cancelled) setLoaded(true);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).twttr?.widgets?.createTweet) {
      createEmbed();
      return () => { cancelled = true; };
    }

    // Load widgets.js if not loaded
    let script = document.querySelector('script[src*="platform.twitter.com/widgets.js"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.head.appendChild(script);
    }

    // Poll for twttr.widgets.createTweet availability
    const poll = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).twttr?.widgets?.createTweet) {
        clearInterval(poll);
        createEmbed();
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(poll), 20000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [tweetId]);

  if (!tweetId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="text-cs-blue hover:underline">
          View on X
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex justify-center min-h-[200px]">
      {!loaded && (
        <div className="text-sm text-muted-foreground self-center">Loading tweet...</div>
      )}
    </div>
  );
}
