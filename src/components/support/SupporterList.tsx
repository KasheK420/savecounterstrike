/**
 * @fileoverview Displays Ko-fi supporters grouped by tier.
 * Server component — fetches supporter data directly from DB.
 */

import { db } from "@/lib/db";
import { Users } from "lucide-react";

/** Tier display configuration — colors and labels matching CS2 rank theme. */
const TIER_CONFIG: Record<number, { label: string; color: string; bgColor: string }> = {
  10: { label: "Yacht Owner", color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20" },
  9:  { label: "The Howling Alpha", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  8:  { label: "Global Elite", color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20" },
  7:  { label: "Supreme Master First Class", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
  6:  { label: "Legendary Eagle Master", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
  5:  { label: "Legendary Eagle", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
  4:  { label: "Distinguished Master Guardian", color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20" },
  3:  { label: "Master Guardian", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
  2:  { label: "Gold Nova 1", color: "text-yellow-300", bgColor: "bg-yellow-500/10 border-yellow-500/20" },
  1:  { label: "Silver 1", color: "text-gray-400", bgColor: "bg-gray-500/10 border-gray-500/20" },
};

interface SupporterRow {
  displayName: string;
  avatarUrl: string | null;
  tier: string;
  tierLevel: number;
  customMessage: string | null;
  steamId: string;
  createdAt: Date;
}

export async function SupporterList() {
  let supporters: SupporterRow[] = [];
  try {
    supporters = await db.supporter.findMany({
      where: { isActive: true },
      orderBy: [{ tierLevel: "desc" }, { createdAt: "asc" }],
      select: {
        displayName: true,
        avatarUrl: true,
        tier: true,
        tierLevel: true,
        customMessage: true,
        steamId: true,
        createdAt: true,
      },
    });
  } catch {
    // Table may not exist yet (migration pending)
    return null;
  }

  if (supporters.length === 0) {
    return null;
  }

  // Group by tier level
  const grouped = new Map<number, SupporterRow[]>();
  for (const s of supporters) {
    const existing = grouped.get(s.tierLevel) ?? [];
    existing.push(s);
    grouped.set(s.tierLevel, existing);
  }

  // Sort tier groups by level descending
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => b - a);

  return (
    <div className="cs-card rounded-xl p-8 space-y-8">
      <div className="text-center">
        <Users className="h-8 w-8 text-cs-orange mx-auto mb-3" />
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Our Supporters
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Community members who keep SaveCounterStrike running
        </p>
      </div>

      {sortedGroups.map(([tierLevel, members]) => {
        const config = TIER_CONFIG[tierLevel] ?? TIER_CONFIG[1];

        return (
          <div key={tierLevel} className="space-y-3">
            <h3 className={`font-heading text-sm font-bold uppercase tracking-wider ${config.color}`}>
              {config.label}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((supporter) => (
                <a
                  key={supporter.steamId}
                  href={`https://steamcommunity.com/profiles/${supporter.steamId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-white/5 ${config.bgColor}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supporter.avatarUrl || "/images/default-avatar.png"}
                    alt={supporter.displayName}
                    width={40}
                    height={40}
                    className="rounded-full shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {supporter.displayName}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${config.color}`}>
                        {supporter.tier}
                      </span>
                    </div>
                    {supporter.customMessage && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-2">
                        &ldquo;{supporter.customMessage}&rdquo;
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
