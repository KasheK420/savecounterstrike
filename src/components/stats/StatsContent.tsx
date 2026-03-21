"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Shield,
  ShieldAlert,
  Clock,
  Gamepad2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface StatsData {
  currentPlayers: number;
  totalSignatures: number;
  community: {
    totalWithCs2: number;
    averagePlaytimeHours: number;
    totalPlaytimeHours: number;
  };
  faceitDistribution: { level: number; count: number }[];
  tracked: {
    totalTracked: number;
    totalVacBanned: number;
    totalGameBanned: number;
  };
  banWaves: {
    id: string;
    date: string;
    title: string;
    description: string | null;
    estimatedBans: number | null;
    source: string | null;
  }[];
  banHistory: {
    date: string;
    totalTracked: number;
    totalVacBanned: number;
    totalGameBanned: number;
    newBansToday: number;
  }[];
  leaderboard: {
    steamId: string;
    displayName: string | null;
    avatarUrl: string | null;
    premierRating: number | null;
    competitiveRank: number | null;
    wins: number | null;
    vacBanned: boolean;
    numberOfVacBans: number;
    numberOfGameBans: number;
    daysSinceLastBan: number | null;
  }[];
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "text-cs-orange",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <div className="cs-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-heading">
          {title}
        </span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="cs-stat-number text-2xl font-heading text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

const PREMIER_COLORS: Record<string, string> = {
  "0": "text-[#B0B0B0]",      // Unranked / low
  "5000": "text-[#6DC8F2]",   // Cyan
  "10000": "text-[#4B84DC]",  // Blue
  "15000": "text-[#8847FF]",  // Purple
  "20000": "text-[#D32CE6]",  // Pink
  "25000": "text-[#EB4B4B]",  // Red
  "30000": "text-[#FFD700]",  // Gold
};

function getPremierColor(rating: number): string {
  if (rating >= 30000) return PREMIER_COLORS["30000"];
  if (rating >= 25000) return PREMIER_COLORS["25000"];
  if (rating >= 20000) return PREMIER_COLORS["20000"];
  if (rating >= 15000) return PREMIER_COLORS["15000"];
  if (rating >= 10000) return PREMIER_COLORS["10000"];
  if (rating >= 5000) return PREMIER_COLORS["5000"];
  return PREMIER_COLORS["0"];
}

function getFaceitColor(level: number): string {
  if (level <= 1) return "bg-[#CCC]";
  if (level <= 3) return "bg-[#1CE400]";
  if (level <= 6) return "bg-[#FFC800]";
  if (level <= 9) return "bg-[#FF6309]";
  return "bg-[#FF0000]";
}

export function StatsContent() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading statistics...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen py-16 text-center">
        <p className="text-muted-foreground">Failed to load statistics.</p>
      </div>
    );
  }

  const banRate =
    data.tracked.totalTracked > 0
      ? ((data.tracked.totalVacBanned / data.tracked.totalTracked) * 100).toFixed(1)
      : "0";

  const maxFaceit = Math.max(
    ...data.faceitDistribution.map((f) => f.count),
    1
  );

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <BarChart3 className="h-12 w-12 text-cs-green mx-auto opacity-70" />
          <h1 className="font-heading text-4xl font-bold">
            CS2 <span className="text-cs-green">STATISTICS</span>
          </h1>
          {data.currentPlayers > 0 && (
            <p className="text-lg text-muted-foreground">
              <span className="text-cs-green font-bold">
                {data.currentPlayers.toLocaleString()}
              </span>{" "}
              players online right now
            </p>
          )}
        </div>

        {/* Community Stats */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg uppercase tracking-widest text-muted-foreground">
            Community
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Petition Signatures"
              value={data.totalSignatures}
              icon={Users}
              color="text-cs-orange"
            />
            <StatCard
              title="Own CS2"
              value={data.community.totalWithCs2}
              subtitle="Signers who own CS2"
              icon={Gamepad2}
              color="text-cs-green"
            />
            <StatCard
              title="Avg. Playtime"
              value={`${data.community.averagePlaytimeHours}h`}
              subtitle="Per player"
              icon={Clock}
              color="text-blue-400"
            />
            <StatCard
              title="Total Playtime"
              value={`${Math.round(data.community.totalPlaytimeHours / 1000)}k h`}
              subtitle="All signers combined"
              icon={Clock}
              color="text-purple-400"
            />
          </div>
        </section>

        {/* FACEIT Distribution */}
        {data.faceitDistribution.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg uppercase tracking-widest text-muted-foreground">
              FACEIT Level Distribution
            </h2>
            <div className="cs-card rounded-lg p-6">
              <div className="flex items-end gap-2 h-32">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
                  const entry = data.faceitDistribution.find(
                    (f) => f.level === level
                  );
                  const count = entry?.count ?? 0;
                  const height = count > 0 ? (count / maxFaceit) * 100 : 2;

                  return (
                    <div
                      key={level}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {count > 0 ? count : ""}
                      </span>
                      <div
                        className={`w-full rounded-t ${getFaceitColor(level)} transition-all`}
                        style={{ height: `${height}%`, minHeight: "2px" }}
                      />
                      <span className="text-xs font-bold text-muted-foreground">
                        {level}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Ban Statistics */}
        {data.tracked.totalTracked > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg uppercase tracking-widest text-muted-foreground">
              Ban Statistics
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Tracked Players"
                value={data.tracked.totalTracked}
                icon={Shield}
                color="text-blue-400"
              />
              <StatCard
                title="VAC Banned"
                value={data.tracked.totalVacBanned}
                subtitle={`${banRate}% of tracked`}
                icon={ShieldAlert}
                color="text-red-500"
              />
              <StatCard
                title="Game Banned"
                value={data.tracked.totalGameBanned}
                icon={AlertTriangle}
                color="text-yellow-500"
              />
              <StatCard
                title="Ban Rate"
                value={`${banRate}%`}
                subtitle="Among tracked players"
                icon={BarChart3}
                color="text-red-400"
              />
            </div>
          </section>
        )}

        {/* Premier Leaderboard */}
        {data.leaderboard.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg uppercase tracking-widest text-muted-foreground">
              Premier Leaderboard
            </h2>
            <div className="cs-card rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left p-3 w-12">#</th>
                      <th className="text-left p-3">Player</th>
                      <th className="text-right p-3">Rating</th>
                      <th className="text-right p-3">Wins</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {data.leaderboard.map((player, i) => (
                      <tr
                        key={player.steamId}
                        className={
                          player.vacBanned || player.numberOfGameBans > 0
                            ? "bg-red-500/5"
                            : ""
                        }
                      >
                        <td className="p-3 text-muted-foreground font-mono">
                          {i + 1}
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-foreground">
                            {player.displayName || player.steamId}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-right font-bold font-mono ${getPremierColor(player.premierRating ?? 0)}`}
                        >
                          {player.premierRating?.toLocaleString() ?? "—"}
                        </td>
                        <td className="p-3 text-right text-muted-foreground font-mono">
                          {player.wins?.toLocaleString() ?? "—"}
                        </td>
                        <td className="p-3 text-center">
                          {player.vacBanned ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-500">
                              VAC
                            </span>
                          ) : player.numberOfGameBans > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/15 text-yellow-500">
                              GAME BAN
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-500">
                              CLEAN
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Ban Waves */}
        {data.banWaves.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg uppercase tracking-widest text-muted-foreground">
              Known Ban Waves
            </h2>
            <div className="space-y-3">
              {data.banWaves.map((wave) => (
                <div
                  key={wave.id}
                  className="cs-card rounded-lg p-4 flex items-start gap-4"
                >
                  <div className="shrink-0 text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {new Date(wave.date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {new Date(wave.date).getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(wave.date).getFullYear()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">
                      {wave.title}
                    </h3>
                    {wave.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {wave.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {wave.estimatedBans && (
                        <span className="text-red-400 font-medium">
                          ~{wave.estimatedBans.toLocaleString()} bans
                        </span>
                      )}
                      {wave.source && (
                        <a
                          href={wave.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state when no tracked data */}
        {data.tracked.totalTracked === 0 && data.banWaves.length === 0 && (
          <section className="text-center py-8 text-muted-foreground space-y-2">
            <ShieldAlert className="h-12 w-12 mx-auto opacity-30" />
            <p>Ban tracking data is being collected.</p>
            <p className="text-sm">
              Leaderboard and ban statistics will appear once the tracking bot is
              active.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
