import Link from "next/link";
import { Shield } from "lucide-react";
import { DISCORD_INVITE, KOFI_URL, GITHUB_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-cs-darker py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-heading text-lg font-bold tracking-wider mb-3"
            >
              <Shield className="h-5 w-5 text-cs-orange" />
              <span className="text-cs-orange">SAVE</span>
              <span className="text-foreground">CS</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A community-driven initiative demanding Valve implement proper
              anti-cheat measures in Counter-Strike 2.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3 uppercase tracking-wider">
              Navigate
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/petition"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Sign the Petition
              </Link>
              <Link
                href="/videos"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Cheater Videos
              </Link>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/opinions"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Community Opinions
              </Link>
              <Link
                href="/revenue"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Revenue Tracker
              </Link>
            </div>
          </div>

          {/* Project */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3 uppercase tracking-wider">
              Project
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/support"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Support Us
              </Link>
              <Link
                href="/faq"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/credits"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Credits
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              Not affiliated with Valve Corporation.
            </p>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3 uppercase tracking-wider">
              Community
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Discord
              </a>
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Ko-fi
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap justify-center gap-4">
          <Link href="/terms" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Cookie Policy
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-border/30 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SaveCounterStrike.com — Created by{" "}
            <a href="https://majorluk.pl" target="_blank" rel="noopener noreferrer" className="hover:text-cs-orange transition-colors">Lukas Majoros</a>. Built by the community, for the community.
          </p>
          <p className="text-[10px] text-muted-foreground/40 tabular-nums">
            v{process.env.NEXT_PUBLIC_APP_VERSION || "dev"} ·{" "}
            <a
              href={`https://github.com/KasheK420/savecounterstrike/commit/${process.env.NEXT_PUBLIC_GIT_SHA || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground/60 transition-colors"
            >
              {process.env.NEXT_PUBLIC_GIT_SHA || "dev"}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
