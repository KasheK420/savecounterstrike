import type { Metadata } from "next";
import { RevenueTickerHero } from "@/components/hero/RevenueTickerHero";
import { DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Revenue Tracker",
  description: "See how much Valve earns from CS2 while cheaters go unpunished.",
};

export default function RevenuePage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <DollarSign className="h-16 w-16 text-cs-green mx-auto mb-6 opacity-50" />
          <h1 className="font-heading text-4xl font-bold mb-4">
            REVENUE <span className="text-cs-green">TRACKER</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how much money Valve earns from Counter-Strike 2 while the
            cheating epidemic goes unaddressed.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <RevenueTickerHero />
        </div>

        <div className="mt-12 cs-card rounded-xl p-8">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">
            Where does this money come from?
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Counter-Strike 2 generates revenue through multiple streams:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-foreground">Case keys</strong> — $2.49 each, millions sold monthly
              </li>
              <li>
                <strong className="text-foreground">Steam Market fees</strong> — 15% cut on every skin transaction
              </li>
              <li>
                <strong className="text-foreground">Operation passes</strong> — Seasonal content at $14.99
              </li>
              <li>
                <strong className="text-foreground">Stickers & capsules</strong> — Major tournament merchandise
              </li>
            </ul>
            <p className="text-sm italic">
              Revenue estimates are based on publicly available data from SteamDB,
              market analysis, and community research. Actual figures may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
