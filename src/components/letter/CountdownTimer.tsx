"use client";

import { useEffect, useState } from "react";
import { Clock, Send } from "lucide-react";

const DEADLINE = new Date("2026-08-31T00:00:00Z").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(): TimeLeft {
  const total = DEADLINE - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

export function CountdownTimer() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="cs-card rounded-xl p-8 text-center">
        <Clock className="h-8 w-8 text-cs-orange mx-auto animate-pulse" />
      </div>
    );
  }

  const expired = time.total <= 0;

  if (expired) {
    return (
      <div className="cs-card rounded-xl p-8 text-center space-y-4">
        <Send className="h-12 w-12 text-cs-orange mx-auto" />
        <h3 className="font-heading text-2xl font-bold text-cs-orange cs-glow">
          LETTER SENT
        </h3>
        <p className="text-muted-foreground">
          The open letter has been delivered to Valve Corporation.
          <br />
          <strong className="text-foreground">
            Awaiting their response. Or their silence.
          </strong>
        </p>
      </div>
    );
  }

  const blocks = [
    { value: time.days, label: "DAYS" },
    { value: time.hours, label: "HOURS" },
    { value: time.minutes, label: "MIN" },
    { value: time.seconds, label: "SEC" },
  ];

  return (
    <div className="cs-card rounded-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-cs-orange" />
          <span className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">
            This letter will be sent to Valve in
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {blocks.map((block) => (
          <div key={block.label} className="text-center">
            <div className="bg-background/80 border border-cs-orange/20 rounded-lg py-3 px-2">
              <div className="cs-stat-number text-3xl sm:text-4xl font-heading text-cs-orange">
                {String(block.value).padStart(2, "0")}
              </div>
            </div>
            <div className="text-[10px] tracking-widest text-muted-foreground mt-2 font-heading">
              {block.label}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center space-y-3">
        <p className="text-xs text-muted-foreground">
          On{" "}
          <strong className="text-foreground">August 31, 2026</strong>, this
          letter — with every signature — will be delivered directly to Valve
          Corporation.
        </p>
        <p className="text-xs text-muted-foreground">
          Then we publish their response.{" "}
          <span className="text-cs-orange">Or their silence.</span>
        </p>
      </div>
    </div>
  );
}
