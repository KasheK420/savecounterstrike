"use client";

import { useEffect, useState } from "react";

interface SignatureCounterProps {
  initialCount?: number;
}

export function SignatureCounter({ initialCount = 0 }: SignatureCounterProps) {
  const [count, setCount] = useState(initialCount);
  const [displayCount, setDisplayCount] = useState(initialCount);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/petition");
        const data = await res.json();
        setCount(data.count);
      } catch {
        // Use initial count on error
      }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Animated counter
  useEffect(() => {
    if (displayCount === count) return;
    const diff = count - displayCount;
    const step = Math.max(1, Math.floor(diff / 30));
    const timer = setTimeout(() => {
      setDisplayCount((prev) => {
        const next = prev + step;
        return next >= count ? count : next;
      });
    }, 20);
    return () => clearTimeout(timer);
  }, [count, displayCount]);

  const formattedCount = displayCount.toLocaleString("en-US");

  return (
    <div className="text-center">
      <div className="cs-stat-number text-6xl sm:text-7xl md:text-8xl font-heading text-cs-orange cs-glow">
        {formattedCount}
      </div>
      <p className="text-muted-foreground text-lg mt-2 uppercase tracking-widest font-heading">
        Signatures
      </p>
    </div>
  );
}
