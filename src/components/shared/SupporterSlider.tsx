"use client";

import { useEffect, useState } from "react";
import { Handshake } from "lucide-react";

interface Supporter {
  name: string;
  logoUrl: string;
  url?: string;
}

export function SupporterSlider() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);

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

  // Duplicate for seamless infinite loop
  const items = [...supporters, ...supporters];

  return (
    <section className="py-8 overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 text-muted-foreground/40">
          <Handshake className="h-3.5 w-3.5" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-heading">
            Supported by
          </span>
        </div>
      </div>

      <div className="supporter-track-wrapper">
        <div className="supporter-track">
          {items.map((supporter, i) => {
            const content = (
              <div className="supporter-item" key={`${supporter.name}-${i}`}>
                <img
                  src={supporter.logoUrl}
                  alt={supporter.name}
                  className="h-10 w-auto max-w-[120px] object-contain mx-auto"
                  loading="lazy"
                />
                <span className="text-[10px] text-muted-foreground/50 mt-1.5 block truncate max-w-[100px] mx-auto">
                  {supporter.name}
                </span>
              </div>
            );

            return supporter.url ? (
              <a
                key={`${supporter.name}-${i}`}
                href={supporter.url}
                target="_blank"
                rel="noopener noreferrer"
                className="supporter-item-link"
              >
                {content}
              </a>
            ) : (
              content
            );
          })}
        </div>
      </div>
    </section>
  );
}
