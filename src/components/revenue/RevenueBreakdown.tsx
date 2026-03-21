"use client";

import { useEffect, useState } from "react";
import { Package, TrendingUp, ShoppingCart, Calendar } from "lucide-react";

interface RevenueData {
  dailyCaseOpenings: number;
  dailyKeyRevenue: number;
  dailyMarketFeeRevenue: number;
  dailyTotalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  caseMarketVolume24h: number;
  trackedCases?: { name: string; volume: number; price: number }[];
}

export function RevenueBreakdown() {
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/revenue");
        const json = await res.json();
        if (json.dailyTotalRevenue) setData(json);
      } catch {
        // Silent
      }
    }
    fetchRevenue();
  }, []);

  if (!data) return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Revenue split */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="cs-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-cs-orange" />
            <h3 className="font-heading font-semibold text-foreground">
              Case Key Revenue
            </h3>
          </div>
          <div className="cs-stat-number text-2xl text-cs-orange font-heading">
            ${(data.dailyKeyRevenue / 1_000_000).toFixed(2)}M
            <span className="text-sm text-muted-foreground font-normal">
              /day
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ~{(data.dailyCaseOpenings / 1000).toFixed(0)}K cases opened daily
            &times; $2.50/key
          </p>
        </div>

        <div className="cs-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-5 w-5 text-cs-blue" />
            <h3 className="font-heading font-semibold text-foreground">
              Market Fee Revenue
            </h3>
          </div>
          <div className="cs-stat-number text-2xl text-cs-blue font-heading">
            ${(data.dailyMarketFeeRevenue / 1000).toFixed(0)}K
            <span className="text-sm text-muted-foreground font-normal">
              /day
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            15% fee on ~$3.3M daily Steam Market transactions
          </p>
        </div>
      </div>

      {/* Time scale */}
      <div className="cs-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-cs-green" />
          <h3 className="font-heading font-semibold text-foreground">
            Revenue Over Time
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="cs-stat-number text-xl text-foreground font-heading">
              ${(data.dailyTotalRevenue / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-xs text-muted-foreground mt-1">Per Day</div>
          </div>
          <div>
            <div className="cs-stat-number text-xl text-foreground font-heading">
              ${(data.monthlyRevenue / 1_000_000).toFixed(0)}M
            </div>
            <div className="text-xs text-muted-foreground mt-1">Per Month</div>
          </div>
          <div>
            <div className="cs-stat-number text-xl text-foreground font-heading">
              ${(data.yearlyRevenue / 1_000_000_000).toFixed(2)}B
            </div>
            <div className="text-xs text-muted-foreground mt-1">Per Year</div>
          </div>
        </div>
      </div>

      {/* Live case volumes */}
      {data.trackedCases && data.trackedCases.length > 0 && (
        <div className="cs-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-cs-gold" />
            <h3 className="font-heading font-semibold text-foreground">
              Live Market Volume (24h)
            </h3>
          </div>
          <div className="space-y-2">
            {data.trackedCases
              .filter((c) => c.volume > 0)
              .sort((a, b) => b.volume - a.volume)
              .map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {c.name}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground/70">
                      ${c.price.toFixed(2)}
                    </span>
                    <span className="cs-stat-number text-sm text-foreground min-w-[80px] text-right">
                      {c.volume.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-3">
            Source: Steam Community Market API &middot; Updates every hour
          </p>
        </div>
      )}
    </div>
  );
}
