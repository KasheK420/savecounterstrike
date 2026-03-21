"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface NotableSigner {
  label: string;
  role: string;
  avatarUrl: string | null;
  hasSigned: boolean;
  signedAt: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  "Pro Player": "border-cs-orange/30 text-cs-orange",
  Organization: "border-cs-blue/30 text-cs-blue",
  Streamer: "border-[#9146ff]/30 text-[#9146ff]",
  Youtuber: "border-cs-red/30 text-cs-red",
  "Community Figure": "border-cs-gold/30 text-cs-gold",
};

export function NotableSigners() {
  const [signers, setSigners] = useState<NotableSigner[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotable() {
      try {
        const res = await fetch("/api/notable");
        const data = await res.json();
        if (Array.isArray(data)) setSigners(data);
      } catch {
        // Silent
      }
    }
    fetchNotable();
  }, []);

  if (signers.length === 0) return null;

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-center">
        <Star className="h-5 w-5 text-cs-gold" />
        <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground">
          Notable Signatures
        </h3>
        <span className="text-xs text-muted-foreground/50">
          ({signers.length})
        </span>
      </div>

      <div className="relative group">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border/30 rounded-full text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border/30 rounded-full text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {signers.map((signer) => (
            <div
              key={signer.label}
              className={`cs-card rounded-lg p-3 text-center space-y-1.5 shrink-0 w-[120px] ${
                signer.hasSigned
                  ? "border-cs-green/20"
                  : "border-border/30 opacity-70"
              }`}
            >
              <Avatar className="h-10 w-10 mx-auto border-2 border-border/50">
                <AvatarImage
                  src={signer.avatarUrl || undefined}
                  alt={signer.label}
                />
                <AvatarFallback className="bg-cs-navy text-cs-orange text-xs font-bold">
                  {signer.label.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <p className="text-xs font-semibold text-foreground truncate">
                {signer.label}
              </p>
              <Badge
                variant="outline"
                className={`text-[8px] ${ROLE_COLORS[signer.role] || "border-muted-foreground/30 text-muted-foreground"}`}
              >
                {signer.role}
              </Badge>

              <div className="flex items-center justify-center gap-1">
                {signer.hasSigned ? (
                  <>
                    <CheckCircle className="h-2.5 w-2.5 text-cs-green" />
                    <span className="text-[9px] text-cs-green">Signed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                    <span className="text-[9px] text-muted-foreground/50">
                      Invited
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
