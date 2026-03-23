/**
 * @fileoverview Credits page — permanent recognition for LEM+ ($35/mo) Ko-fi supporters.
 * Unlike the supporters page, credits persist even after membership expires.
 */

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Credits",
  description: "The people who made SaveCounterStrike possible.",
};

const TIER_COLORS: Record<number, { label: string; color: string }> = {
  10: { label: "Yacht Owner", color: "text-emerald-400" },
  9: { label: "The Howling Alpha", color: "text-orange-400" },
  8: { label: "Global Elite", color: "text-yellow-400" },
  7: { label: "Supreme Master First Class", color: "text-red-400" },
  6: { label: "Legendary Eagle Master", color: "text-red-400" },
};

export default async function CreditsPage() {
  // LEM+ (tierLevel >= 6) — permanent, regardless of isActive
  const supporters = await db.supporter.findMany({
    where: { tierLevel: { gte: 6 } },
    orderBy: [{ tierLevel: "desc" }, { createdAt: "asc" }],
    select: {
      displayName: true,
      avatarUrl: true,
      tier: true,
      tierLevel: true,
      customMessage: true,
      steamId: true,
      isActive: true,
    },
  });

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Trophy className="h-12 w-12 text-cs-gold mx-auto mb-4" />
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            <span className="text-cs-orange cs-glow">CREDITS</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
            These incredible people helped make SaveCounterStrike possible.
            Their support is permanently recognized here.
          </p>
        </div>

        {supporters.length === 0 ? (
          <div className="cs-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground">
              Be the first to earn a permanent spot on the credits page.
            </p>
            <a
              href="https://ko-fi.com/savecounterstrike"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 cs-btn font-bold"
            >
              Become a Supporter
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {supporters.map((supporter) => {
              const config = TIER_COLORS[supporter.tierLevel] ?? {
                label: supporter.tier,
                color: "text-muted-foreground",
              };

              return (
                <a
                  key={supporter.steamId}
                  href={`https://steamcommunity.com/profiles/${supporter.steamId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-card rounded-xl p-6 flex items-center gap-4 hover:border-cs-orange/30 transition-all group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supporter.avatarUrl || "/images/default-avatar.png"}
                    alt={supporter.displayName}
                    width={56}
                    height={56}
                    className="rounded-full shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-lg text-foreground group-hover:text-cs-orange transition-colors">
                        {supporter.displayName}
                      </span>
                      <span className={`text-xs font-bold uppercase ${config.color}`}>
                        {config.label}
                      </span>
                      {!supporter.isActive && (
                        <span className="text-[10px] text-muted-foreground/50 uppercase">
                          Alumni
                        </span>
                      )}
                    </div>
                    {supporter.customMessage && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        &ldquo;{supporter.customMessage}&rdquo;
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
