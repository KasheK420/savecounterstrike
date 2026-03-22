"use client";

import { useEffect, useRef } from "react";

interface TwitterEmbedProps {
  tweetUrl: string;
}

export function TwitterEmbed({ tweetUrl }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // @ts-expect-error Twitter widgets.js exposes twttr global
    const twttr = window.twttr;
    
    if (twttr && twttr.widgets) {
      // Script already loaded, just load the widgets
      twttr.widgets.load(containerRef.current);
    } else {
      // Load Twitter widgets script
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      
      script.onload = () => {
        // @ts-expect-error Twitter widgets.js exposes twttr global
        if (window.twttr && window.twttr.widgets) {
          // @ts-expect-error Twitter widgets.js exposes twttr global
          window.twttr.widgets.load(containerRef.current);
        }
      };

      document.body.appendChild(script);
    }
  }, [tweetUrl]);

  return (
    <div ref={containerRef} className="w-full max-w-[550px] mx-auto">
      <blockquote className="twitter-tweet" data-theme="dark">
        <a href={tweetUrl}>Loading X post...</a>
      </blockquote>
    </div>
  );
}
