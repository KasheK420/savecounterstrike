"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Signer {
  createdAt: string;
  message: string | null;
  user: {
    displayName: string;
    avatarUrl: string | null;
    steamId: string;
  };
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
        {signers.map((signer) => (
          <div
            key={signer.user.steamId}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
          >
            <Avatar className="h-8 w-8 border border-border/50 shrink-0">
              <AvatarImage
                src={signer.user.avatarUrl || undefined}
                alt={signer.user.displayName}
              />
              <AvatarFallback className="bg-cs-navy text-cs-orange text-xs">
                {signer.user.displayName?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {signer.user.displayName}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(signer.createdAt).toLocaleDateString()}
                </span>
              </div>
              {signer.message && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  &ldquo;{signer.message}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
