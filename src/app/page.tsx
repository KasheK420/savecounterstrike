/**
 * @fileoverview Home page component.
 *
 * Landing page featuring hero section, open letter preview,
 * feature cards for main site sections, and informational content.
 *
 * @module app/page
 */

import { HeroSection } from "@/components/hero/HeroSection";
import { OpenLetter } from "@/components/letter/OpenLetter";
import { Shield, Video, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";

/** Feature cards displayed on the homepage */
const features = [
  {
    icon: Shield,
    title: "Sign the Letter",
    description:
      "Add your signature to the open letter we'll deliver to Valve on August 31, 2026.",
    href: "/petition",
    color: "text-cs-orange",
  },
  {
    icon: Video,
    title: "Share Evidence",
    description:
      "Upload clips of cheaters ruining matches. Build an undeniable case for change.",
    href: "/media",
    color: "text-cs-blue",
  },
  {
    icon: MessageSquare,
    title: "Community Requests",
    description:
      "Submit and vote on what Valve has ignored for years. Your voice shapes the letter.",
    href: "/opinions",
    color: "text-cs-gold",
  },
  {
    icon: BarChart3,
    title: "Track the Money",
    description:
      "See exactly how much Valve earns from CS2 while ignoring the community.",
    href: "/revenue",
    color: "text-cs-green",
  },
];

/**
 * Home page component — main landing page for the site.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Open Letter */}
      <OpenLetter />

      {/* Features section */}
      <section className="py-20 bg-cs-darker">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              TAKE <span className="text-cs-orange">ACTION</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Every tool you need to make your voice heard and hold Valve
              accountable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group cs-card rounded-lg p-6 hover:border-cs-orange/30 transition-all duration-300"
              >
                <feature.icon
                  className={`h-10 w-10 ${feature.color} mb-4 group-hover:scale-110 transition-transform`}
                />
                <h3 className="font-heading font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why section — broader messaging */}
      <section className="py-20 bg-cs-darker">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-4">
            BIGGER THAN <span className="text-cs-orange">CHEATING</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Anti-cheat is our primary demand, but the community&apos;s
            frustration runs deeper. Valve has ignored player feedback across
            every aspect of Counter-Strike for years.
          </p>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <div className="cs-card rounded-lg p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                The Cheating Epidemic
              </h3>
              <p>
                Counter-Strike 2 is plagued by cheaters at every skill level.
                From blatant aimbots to subtle wallhacks, the competitive
                experience is being destroyed. VAC is outdated, easily bypassed,
                and Valve has shown no urgency to fix it — despite earning
                billions from the game.
              </p>
            </div>

            <div className="cs-card rounded-lg p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                Years of Silence
              </h3>
              <p>
                Missing features, broken promises, unanswered community
                requests. Players have been asking for basic improvements —
                better matchmaking, tournament features, demo system fixes, UI
                improvements — for years. The response? Silence. Valve collects
                the revenue but refuses to invest proportionally in the game
                that generates it.
              </p>
            </div>

            <div className="cs-card rounded-lg p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                &ldquo;Do Nothing and Win&rdquo; Is Over
              </h3>
              <p>
                For too long, Valve has operated on the assumption that
                Counter-Strike is too big to fail. That players will keep
                buying, keep trading, keep playing — no matter how little Valve
                gives back. That era ends now. This community is organizing,
                documenting, and demanding accountability. Every vote, every
                signature, every shared clip adds to the case.
              </p>
            </div>

            <div className="cs-card rounded-lg p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                What We Want
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  A modern, kernel-level anti-cheat comparable to competitors
                </li>
                <li>
                  Hardware bans and faster detection — days, not months
                </li>
                <li>
                  Transparent reporting: know when your reports lead to action
                </li>
                <li>
                  Regular communication about development priorities
                </li>
                <li>
                  Community-requested features that have been ignored for years
                </li>
                <li>
                  Investment proportional to the revenue CS2 generates
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
