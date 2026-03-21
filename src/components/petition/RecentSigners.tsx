"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { filterProfanity } from "@/lib/profanity";

interface Signer {
  createdAt: string;
  message: string | null;
  user: {
    displayName: string;
    avatarUrl: string | null;
    steamId: string;
    ownsCs2: boolean | null;
    cs2PlaytimeHours: number | null;
    cs2Kills: number | null;
    cs2Deaths: number | null;
    cs2HeadshotPct: number | null;
    faceitLevel: number | null;
    faceitElo: number | null;
    profileVisibility: number | null;
  };
}

function StatBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${className}`}
    >
      {children}
    </span>
  );
}

export function RecentSigners() {
  const [signers, setSigners] = useState<Signer[]>([]);

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

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground text-center">
        Recent Signatures
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {signers.map((signer) => {
          const u = signer.user;
          const kd =
            u.cs2Kills != null && u.cs2Deaths != null && u.cs2Deaths > 0
              ? (u.cs2Kills / u.cs2Deaths).toFixed(2)
              : null;

          return (
            <div
              key={u.steamId}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
            >
              <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                <AvatarImage
                  src={u.avatarUrl || undefined}
                  alt={u.displayName}
                />
                <AvatarFallback className="bg-cs-navy text-cs-orange text-xs">
                  {u.displayName?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {u.displayName}
                  </span>
                  {u.cs2PlaytimeHours != null && u.cs2PlaytimeHours > 0 && (
                    <StatBadge className="bg-cs-orange/15 text-cs-orange">
                      {u.cs2PlaytimeHours.toLocaleString()}h
                    </StatBadge>
                  )}
                  {kd && (
                    <StatBadge className="bg-blue-500/15 text-blue-400">
                      K/D {kd}
                    </StatBadge>
                  )}
                  {u.cs2HeadshotPct != null && u.cs2HeadshotPct > 0 && (
                    <StatBadge className="bg-emerald-500/15 text-emerald-400">
                      HS {u.cs2HeadshotPct}%
                    </StatBadge>
                  )}
                  {u.faceitLevel != null && u.faceitLevel > 0 && (
                    <StatBadge className="bg-orange-500/15 text-orange-400">
                      FACEIT Lv.{u.faceitLevel}
                    </StatBadge>
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
        })}
      </div>
    </div>
  );
}
