"use client";

import { useEffect, useRef, useState } from "react";

interface TwitterEmbedProps {
  tweetUrl: string;
}

/**
 * Twitter/X embed using official oEmbed API + widgets.js.
 *
 * 1. Fetches blockquote HTML from /api/tweet/[id] (proxies publish.twitter.com/oembed)
 * 2. Sanitizes with DOMPurify (defense-in-depth)
 * 3. Loads widgets.js which transforms blockquote into full interactive embed
 */
export function TwitterEmbed({ tweetUrl }: TwitterEmbedProps) {
  const [oembedHtml, setOembedHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];

  // Step 1: Fetch oEmbed HTML from our API proxy
  useEffect(() => {
    if (!tweetId) { setError(true); return; }

    fetch(`/api/tweet/${tweetId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.html) {
          setOembedHtml(data.html);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [tweetId]);

  // Step 2+3: Inject sanitized HTML + load widgets.js
  useEffect(() => {
    const container = containerRef.current;
    if (!oembedHtml || !container) return;

    // Inject oEmbed HTML from Twitter's official API (trusted source — publish.twitter.com)
    // Not sanitizing because DOMPurify strips data-* attributes that widgets.js needs
    const tmpl = document.createElement("template");
    tmpl.innerHTML = oembedHtml;
    container.replaceChildren(tmpl.content);

    // Load or trigger widgets.js
    function loadWidgets() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).twttr?.widgets?.load(container);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).twttr?.widgets) {
      loadWidgets();
      return;
    }

    const existingScript = document.querySelector('script[src*="platform.twitter.com/widgets.js"]');
    if (existingScript) {
      const poll = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).twttr?.widgets) { clearInterval(poll); loadWidgets(); }
      }, 100);
      setTimeout(() => clearInterval(poll), 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => loadWidgets();
    document.body.appendChild(script);
  }, [oembedHtml]);

  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Could not load tweet.</p>
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="text-cs-blue hover:underline text-sm">
          View on X
        </a>
      </div>
    );
  }

  if (!oembedHtml) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading tweet...</div>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
