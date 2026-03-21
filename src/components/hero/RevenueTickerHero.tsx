"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign } from "lucide-react";

// CS2 estimated daily revenue (rough estimate based on public data)
// ~$1M/day from cases, keys, market fees, etc.
const ESTIMATED_DAILY_REVENUE_USD = 1_000_000;
const PER_SECOND = ESTIMATED_DAILY_REVENUE_USD / 86400;

export function RevenueTickerHero() {
  const [pageSeconds, setPageSeconds] = useState(0);
  const startRef = useRef(Date.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setPageSeconds(elapsed);
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const earned = pageSeconds * PER_SECOND;

  return (
    <div className="cs-card rounded-lg p-6 text-center">
      <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
        <DollarSign className="h-4 w-4 text-cs-green" />
        <span className="text-xs uppercase tracking-widest font-heading">
          Valve earned while you&apos;re on this page
        </span>
      </div>
      <div className="cs-stat-number text-3xl sm:text-4xl text-cs-green font-heading">
        ${earned.toFixed(2)}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
        <div>
          <div className="cs-stat-number text-sm text-foreground">
            ${PER_SECOND.toFixed(2)}
          </div>
          <div>/sec</div>
        </div>
        <div>
          <div className="cs-stat-number text-sm text-foreground">
            ${(PER_SECOND * 60).toFixed(0)}
          </div>
          <div>/min</div>
        </div>
        <div>
          <div className="cs-stat-number text-sm text-foreground">
            ${(PER_SECOND * 3600).toLocaleString()}
          </div>
          <div>/hour</div>
        </div>
        <div>
          <div className="cs-stat-number text-sm text-foreground">
            ${ESTIMATED_DAILY_REVENUE_USD.toLocaleString()}
          </div>
          <div>/day</div>
        </div>
      </div>
    </div>
  );
}
