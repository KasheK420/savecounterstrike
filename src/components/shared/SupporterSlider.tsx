"use client";

import { useEffect, useState, useRef } from "react";
import { Handshake } from "lucide-react";

interface Supporter {
  name: string;
  logoUrl: string;
  url?: string;
}

export function SupporterSlider() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSupporters() {
      try {
        const res = await fetch("/api/supporters");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setSupporters(data);
      } catch {
        // Silent
      }
    }
    fetchSupporters();
  }, []);

  if (supporters.length === 0) return null;

  // Duplicate for seamless infinite loop (CSS translates -50%)
  const items = [...supporters, ...supporters];

  return (
    <div className="mt-12 pt-8 border-t border-border/10 overflow-hidden relative">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 text-muted-foreground/40">
          <Handshake className="h-3.5 w-3.5" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-heading">
            Supported by
          </span>
        </div>
      </div>

      <div className="supporter-track-wrapper">
        <div className="supporter-track" ref={trackRef}>
          {items.map((supporter, i) => {
            const Tag = supporter.url ? "a" : "div";
            const linkProps = supporter.url
              ? {
                  href: supporter.url,
                  target: "_blank" as const,
                  rel: "noopener noreferrer",
                }
              : {};

            return (
              <Tag
                key={`s-${i}`}
                {...linkProps}
                className="supporter-item"
              >
                <img
                  src={supporter.logoUrl}
                  alt={supporter.name}
                  className="h-10 w-auto max-w-[120px] object-contain"
                />
                <span className="text-[10px] text-muted-foreground/50 mt-1.5 block truncate max-w-[100px]">
                  {supporter.name}
                </span>
              </Tag>
            );
          })}
        </div>
      </div>
    </div>
  );
}
