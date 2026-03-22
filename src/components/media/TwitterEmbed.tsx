"use client";

import { useEffect, useRef } from "react";

interface TwitterEmbedProps {
  tweetUrl: string;
}

/**
 * Twitter/X embed using official oEmbed approach.
 *
 * Simply renders a blockquote with class="twitter-tweet" (exactly what
 * publish.twitter.com generates) and loads widgets.js which transforms
 * it into a full interactive iframe embed.
 *
 * No API call needed — widgets.js fetches tweet data itself based on the
 * link inside the blockquote.
 */
export function TwitterEmbed({ tweetUrl }: TwitterEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twttr = (window as any).twttr;

    if (twttr?.widgets) {
      twttr.widgets.load(ref.current);
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
      const poll = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).twttr?.widgets) {
          clearInterval(poll);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).twttr.widgets.load(ref.current!);
        }
      }, 200);
      setTimeout(() => clearInterval(poll), 15000);
      return;
    }

    // Load widgets.js
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
    // widgets.js auto-scans document for .twitter-tweet on load — no manual trigger needed
  }, [tweetUrl]);

  return (
    <div ref={ref} className="flex justify-center">
      <blockquote className="twitter-tweet" data-theme="dark">
        <a href={tweetUrl}>Loading tweet...</a>
      </blockquote>
    </div>
  );
}
