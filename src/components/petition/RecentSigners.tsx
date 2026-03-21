"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { filterProfanity } from "@/lib/profanity";

interface Signer {
  id: string;
  createdAt: string;
  message: string | null;
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

          return (
            <div
              key={signer.id || u.id}
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
        })}
      </div>
    </div>
  );
}
