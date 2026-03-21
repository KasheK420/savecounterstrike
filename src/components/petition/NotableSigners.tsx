"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Star } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-center">
        <Star className="h-5 w-5 text-cs-gold" />
        <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground">
          Notable Signatures
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {signers.map((signer) => (
          <div
            key={signer.label}
            className={`cs-card rounded-lg p-4 text-center space-y-2 ${
              signer.hasSigned
                ? "border-cs-green/20"
                : "border-border/30 opacity-70"
            }`}
          >
            <Avatar className="h-12 w-12 mx-auto border-2 border-border/50">
              <AvatarImage src={signer.avatarUrl || undefined} alt={signer.label} />
              <AvatarFallback className="bg-cs-navy text-cs-orange text-sm font-bold">
                {signer.label.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="text-sm font-semibold text-foreground truncate">
                {signer.label}
              </p>
              <Badge
                variant="outline"
                className={`text-[9px] mt-1 ${ROLE_COLORS[signer.role] || "border-muted-foreground/30 text-muted-foreground"}`}
              >
                {signer.role}
              </Badge>
            </div>

            <div className="flex items-center justify-center gap-1">
              {signer.hasSigned ? (
                <>
                  <CheckCircle className="h-3 w-3 text-cs-green" />
                  <span className="text-[10px] text-cs-green">Signed</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/50">
                    Invited
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
