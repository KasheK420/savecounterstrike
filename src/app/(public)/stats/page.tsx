import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Cheater Statistics",
  description: "Statistics on cheating prevalence and VAC bans in CS2.",
};

export default function StatsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <BarChart3 className="h-16 w-16 text-cs-green mx-auto mb-6 opacity-50" />
        <h1 className="font-heading text-4xl font-bold mb-4">
          <span className="text-cs-green">STATISTICS</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Coming soon. Track cheating prevalence, VAC ban waves, and player data.
        </p>
      </div>
    </div>
  );
}
