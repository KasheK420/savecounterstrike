import { HeroSection } from "@/components/hero/HeroSection";
import { Shield, Video, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Shield,
    title: "Sign the Petition",
    description:
      "Add your voice to thousands of players demanding Valve implement proper anti-cheat.",
    href: "/petition",
    color: "text-cs-orange",
  },
  {
    icon: Video,
    title: "Share Evidence",
    description:
      "Upload clips of cheaters ruining matches. Build an undeniable case for change.",
    href: "/videos",
    color: "text-cs-blue",
  },
  {
    icon: MessageSquare,
    title: "Community Voices",
    description:
      "Share your opinion on the state of CS2 and vote on what matters most.",
    href: "/opinions",
    color: "text-cs-gold",
  },
  {
    icon: BarChart3,
    title: "Track the Problem",
    description:
      "View statistics on cheating prevalence, VAC bans, and how much Valve earns.",
    href: "/stats",
    color: "text-cs-green",
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />

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

      {/* Why section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-12">
            WHY <span className="text-cs-orange">THIS MATTERS</span>
          </h2>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <div className="cs-card rounded-lg p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                The Problem
              </h3>
              <p>
                Counter-Strike 2 is plagued by cheaters at every skill level.
                From blatant aimbots to subtle wallhacks, the competitive
                experience is being destroyed. Players spend hours in matches
                only to face opponents who are clearly using unauthorized
                software.
              </p>
            </div>

            <div className="cs-card rounded-lg p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                Valve&apos;s Response
              </h3>
              <p>
                Despite earning millions of dollars daily from CS2 through case
                sales, market transactions, and in-game purchases, Valve&apos;s
                anti-cheat measures remain inadequate. VAC (Valve Anti-Cheat) is
                outdated and easily bypassed. The community deserves better.
              </p>
            </div>

            <div className="cs-card rounded-lg p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                What We Want
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  A modern, kernel-level anti-cheat system comparable to
                  competitors
                </li>
                <li>
                  Faster detection and banning of cheaters — days, not months
                </li>
                <li>
                  Better reporting tools and feedback when reports lead to bans
                </li>
                <li>
                  Hardware bans for repeat offenders to prevent new accounts
                </li>
                <li>
                  Transparency about anti-cheat efforts and ban statistics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
