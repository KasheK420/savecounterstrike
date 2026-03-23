"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { filterProfanity } from "@/lib/profanity";

interface Signer {
  id: string;
  createdAt: string;
  message: string | null;
  verified: boolean;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    ownsCs2: boolean | null;
    cs2PlaytimeHours: number | null;
    faceitLevel: number | null;
    faceitElo: number | null;
    profileVisibility: number | null;
  };
}

/** FACEIT level colors matching their official badge palette */
function getFaceitColor(level: number): string {
  if (level <= 1) return "bg-[#EEE]/15 text-[#CCC]";
  if (level <= 3) return "bg-[#1CE400]/15 text-[#1CE400]";
  if (level <= 6) return "bg-[#FFC800]/15 text-[#FFC800]";
  if (level <= 9) return "bg-[#FF6309]/15 text-[#FF6309]";
  return "bg-[#FF0000]/15 text-[#FF0000]"; // Level 10
}

function SignerCard({ signer }: { signer: Signer }) {
  const u = signer.user;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 shrink-0">
      <Avatar className="h-8 w-8 border border-border/50 shrink-0">
        <AvatarImage src={u.avatarUrl || undefined} alt={u.displayName} />
        <AvatarFallback className="bg-cs-navy text-cs-orange text-xs">
          {u.displayName?.charAt(0)?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">
            {u.displayName}
          </span>
          {!signer.verified && (
            <span className="text-[10px] text-muted-foreground/60">(manual)</span>
          )}
          {u.cs2PlaytimeHours != null && u.cs2PlaytimeHours > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-cs-orange/15 text-cs-orange shrink-0">
              {u.cs2PlaytimeHours.toLocaleString()}h
            </span>
          )}
          {u.faceitLevel != null && u.faceitLevel > 0 && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${getFaceitColor(u.faceitLevel)}`}
            >
              FACEIT {u.faceitLevel}
            </span>
          )}
          <span className="text-xs text-muted-foreground shrink-0 ml-auto">
            {new Date(signer.createdAt).toLocaleDateString()}
          </span>
        </div>
        {signer.message && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            &ldquo;{filterProfanity(signer.message)}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

export function RecentSigners() {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function fetchSigners() {
      try {
        const res = await fetch("/api/petition");
        const data = await res.json();
        setSigners(data.recentSigners || []);
      } catch {
        // Silent fail
      }
    }
    fetchSigners();
  }, []);

  if (signers.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        Be the first to sign the petition!
      </p>
    );
  }

  // For very few signers, just show them statically
  if (signers.length <= 5) {
    return (
      <div className="space-y-3">
        <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground text-center">
          Recent Signatures
        </h3>
        <div className="space-y-2">
          {signers.map((s) => (
            <SignerCard key={s.id} signer={s} />
          ))}
        </div>
      </div>
    );
  }

  const duration = signers.length * 3; // ~3s per signer

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground text-center">
        Recent Signatures
      </h3>
      <div
        className="relative overflow-hidden max-h-[420px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Top/bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 z-10 bg-gradient-to-b from-card to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 z-10 bg-gradient-to-t from-card to-transparent" />

        <div
          className="flex flex-col gap-2"
          style={{
            animation: `signers-scroll-up ${duration}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {/* Render twice for seamless loop */}
          {signers.map((s) => (
            <SignerCard key={`a-${s.id}`} signer={s} />
          ))}
          {signers.map((s) => (
            <SignerCard key={`b-${s.id}`} signer={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
