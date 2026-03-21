"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign, Users, Package, RefreshCw } from "lucide-react";

interface RevenueData {
  currentPlayers: number;
  dailyCaseOpenings: number;
  dailyKeyRevenue: number;
  dailyMarketFeeRevenue: number;
  dailyTotalRevenue: number;
  perSecondRevenue: number;
  perMinuteRevenue: number;
  perHourRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  caseMarketVolume24h: number;
  sources: string[];
  lastUpdated: string;
}

// Fallback until API responds
const FALLBACK: RevenueData = {
  currentPlayers: 0,
  dailyCaseOpenings: 1_058_065,
  dailyKeyRevenue: 2_645_163,
  dailyMarketFeeRevenue: 501_370,
  dailyTotalRevenue: 3_146_533,
  perSecondRevenue: 36.42,
  perMinuteRevenue: 2185.09,
  perHourRevenue: 131106,
  monthlyRevenue: 94_395_990,
  yearlyRevenue: 1_148_484_545,
  caseMarketVolume24h: 0,
  sources: [],
  lastUpdated: "",
};

export function RevenueTickerHero() {
  const [data, setData] = useState<RevenueData>(FALLBACK);
  const [pageSeconds, setPageSeconds] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const startRef = useRef(Date.now());
  const frameRef = useRef<number>(0);

  // Fetch revenue data from API
  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/revenue");
        const json = await res.json();
        if (json.perSecondRevenue) {
          setData(json);
          setLoaded(true);
        }
      } catch {
        // Use fallback
      }
    }
    fetchRevenue();
    const interval = setInterval(fetchRevenue, 15 * 60 * 1000); // refresh every 15 min
    return () => clearInterval(interval);
  }, []);

  // Animated counter
  useEffect(() => {
    function tick() {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setPageSeconds(elapsed);
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const earned = pageSeconds * data.perSecondRevenue;

  return (
    <div className="cs-card rounded-lg p-6">
      {/* Live earned on page */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
          <DollarSign className="h-4 w-4 text-cs-green" />
          <span className="text-xs uppercase tracking-widest font-heading">
            Valve earned while you&apos;re here
          </span>
        </div>
        <div className="cs-stat-number text-3xl sm:text-4xl text-cs-green font-heading">
          ${earned.toFixed(2)}
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mb-4">
        <div className="text-center">
          <div className="cs-stat-number text-sm text-foreground">
            ${data.perSecondRevenue.toFixed(2)}
          </div>
          <div>/sec</div>
        </div>
        <div className="text-center">
          <div className="cs-stat-number text-sm text-foreground">
            ${data.perMinuteRevenue.toLocaleString()}
          </div>
          <div>/min</div>
        </div>
        <div className="text-center">
          <div className="cs-stat-number text-sm text-foreground">
            ${data.perHourRevenue.toLocaleString()}
          </div>
          <div>/hour</div>
        </div>
        <div className="text-center">
          <div className="cs-stat-number text-sm text-foreground">
            ${(data.dailyTotalRevenue / 1_000_000).toFixed(1)}M
          </div>
          <div>/day</div>
        </div>
      </div>

      {/* Live stats */}
      <div className="border-t border-border/30 pt-3 grid grid-cols-2 gap-3 text-xs">
        {data.currentPlayers > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3 w-3 text-cs-blue" />
            <span>
              <strong className="text-foreground">
                {data.currentPlayers.toLocaleString()}
              </strong>{" "}
              playing now
            </span>
          </div>
        )}
        {data.dailyCaseOpenings > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3 w-3 text-cs-orange" />
            <span>
              <strong className="text-foreground">
                ~{(data.dailyCaseOpenings / 1000).toFixed(0)}K
              </strong>{" "}
              cases/day
            </span>
          </div>
        )}
      </div>

      {/* Source attribution */}
      {loaded && data.sources.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
            Data: {data.sources.join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
