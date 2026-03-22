import type { Metadata } from "next";
import Image from "next/image";
import { RevenueTickerHero } from "@/components/hero/RevenueTickerHero";
import { RevenueBreakdown } from "@/components/revenue/RevenueBreakdown";
import { DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Revenue Tracker",
  description:
    "See how much Valve earns from CS2 while cheaters go unpunished.",
};

export default function RevenuePage() {
  return (
    <div className="relative min-h-screen py-16 overflow-hidden">
      {/* Gaben background meme */}
      <div
        className="pointer-events-none absolute top-[12rem] right-[10%] opacity-[0.08] grayscale"
        style={{
          maskImage:
            "radial-gradient(ellipse, black 15%, transparent 60%)",
          WebkitMaskImage:
            "radial-gradient(ellipse, black 15%, transparent 60%)",
        }}
      >
        <Image
          src="/images/gaben.webp"
          alt=""
          width={550}
          height={550}
          className="select-none rotate-[-8deg]"
          aria-hidden="true"
          priority={false}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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

        <RevenueBreakdown />

        <div className="mt-8 cs-card rounded-xl p-8">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">
            Where does this money come from?
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>Counter-Strike 2 generates revenue through multiple streams:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-foreground">Case keys</strong> — $2.50
                each, over 1 million sold daily
              </li>
              <li>
                <strong className="text-foreground">Steam Market fees</strong>{" "}
                — 15% cut on every skin transaction ($1.22B in 2025)
              </li>
              <li>
                <strong className="text-foreground">Operation passes</strong> —
                Seasonal content at $14.99
              </li>
              <li>
                <strong className="text-foreground">
                  Stickers & capsules
                </strong>{" "}
                — Major tournament merchandise
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Revenue estimates based on publicly available data from Steam
            Community Market API, BitSkins analysis (March 2025), ZestyJesus
            yearly analysis (2025), csgocasetracker.com, and CSFloat FloatDB
            case tracking data. Actual Valve revenue may differ. CS2 total skin
            market cap estimated at $4.3B.
          </p>
        </div>
      </div>
    </div>
  );
}
