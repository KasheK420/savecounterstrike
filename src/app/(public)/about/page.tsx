import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Shield,
  Github,
  Users,
  Target,
  Clock,
  MessageSquare,
  Heart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Who we are and why we built SaveCounterStrike.com — a community initiative to hold Valve accountable.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            ABOUT <span className="text-cs-orange cs-glow">US</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
            We&apos;re not a company. We&apos;re not sponsored. We&apos;re
            Counter-Strike players who decided enough is enough.
          </p>
        </div>

        {/* Mission */}
        <div className="space-y-8">
          <div className="cs-card rounded-xl p-8">
            <div className="flex items-start gap-4">
              <Target className="h-8 w-8 text-cs-orange shrink-0 mt-1" />
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                  Our Mission
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  SaveCounterStrike.com exists for one purpose: to give the CS2
                  community a unified voice. For years, players have been
                  frustrated with cheaters, ignored feature requests, and
                  Valve&apos;s silence. We built this platform so those
                  frustrations can be collected, measured, and delivered directly
                  to Valve — impossible to ignore.
                </p>
              </div>
            </div>
          </div>

          <div className="cs-card rounded-xl p-8">
            <div className="flex items-start gap-4">
              <Clock className="h-8 w-8 text-cs-gold shrink-0 mt-1" />
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                  The Open Letter
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  On{" "}
                  <strong className="text-foreground">August 31, 2026</strong>,
                  we will deliver an open letter to Valve Corporation. Attached
                  will be every petition signature, the top-voted community
                  opinions, and undeniable evidence of the problems players face
                  daily. Then we publish their response — or their silence.
                </p>
              </div>
            </div>
          </div>

          <div className="cs-card rounded-xl p-8">
            <div className="flex items-start gap-4">
              <Users className="h-8 w-8 text-cs-blue shrink-0 mt-1" />
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                  Who We Are
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Founded by{" "}
                  <a href="https://majorluk.pl" target="_blank" rel="noopener noreferrer" className="text-foreground font-bold hover:text-cs-orange transition-colors">Lukas Majoros</a>{" "}
                  and maintained by players who care. No corporate backing, no
                  sponsors, no hidden agenda. Just people who love
                  Counter-Strike and refuse to watch it deteriorate in
                  silence. The project is{" "}
                  <a
                    href="https://github.com/KasheK420/savecounterstrike"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cs-orange hover:text-cs-orange-light transition-colors"
                  >
                    fully open source
                  </a>{" "}
                  — anyone can contribute, audit, or fork it.
                </p>
              </div>
            </div>
          </div>

          <div className="cs-card rounded-xl p-8">
            <div className="flex items-start gap-4">
              <MessageSquare className="h-8 w-8 text-cs-green shrink-0 mt-1" />
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                  How You Can Help
                </h2>
                <ul className="text-muted-foreground space-y-3">
                  <li className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-cs-orange mt-1 shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        Sign the petition
                      </strong>{" "}
                      — every signature adds weight to the letter
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-cs-gold mt-1 shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        Submit opinions
                      </strong>{" "}
                      — tell Valve what needs to change, vote on what matters
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-cs-blue mt-1 shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        Share the site
                      </strong>{" "}
                      — the more voices, the louder the message
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Github className="h-4 w-4 text-foreground mt-1 shrink-0" />
                    <span>
                      <strong className="text-foreground">Contribute</strong> —
                      developers can help improve the platform on{" "}
                      <a
                        href="https://github.com/KasheK420/savecounterstrike"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cs-orange hover:text-cs-orange-light transition-colors"
                      >
                        GitHub
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-[#5865F2] mt-1 shrink-0" />
                    <span>
                      <strong className="text-foreground">Join the Discord</strong> —
                      connect with the community, get updates, unlock supporter perks on{" "}
                      <a
                        href="https://discord.gg/zwBzCN6CE5"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cs-orange hover:text-cs-orange-light transition-colors"
                      >
                        our server
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-cs-red mt-1 shrink-0" />
                    <span>
                      <strong className="text-foreground">Support us</strong> —
                      help cover server costs with a{" "}
                      <Link
                        href="/support"
                        className="text-cs-orange hover:text-cs-orange-light transition-colors"
                      >
                        tip on Ko-fi
                      </Link>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center space-y-4">
          <Link
            href="/petition"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-cs-orange hover:bg-cs-orange-light text-background font-heading font-bold text-lg px-8 cs-pulse-glow"
            )}
          >
            <Shield className="h-5 w-5 mr-2" />
            Sign the Petition
          </Link>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SaveCounterStrike.com — Not
            affiliated with Valve Corporation.
          </p>
        </div>
      </div>
    </div>
  );
}
