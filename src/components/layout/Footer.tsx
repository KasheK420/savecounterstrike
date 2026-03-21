import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-cs-darker py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                href="/stats"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                Statistics
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
              <a
                href="https://github.com/KasheK420/savecounterstrike"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-cs-orange transition-colors"
              >
                GitHub
              </a>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              Not affiliated with Valve Corporation.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SaveCounterStrike.com — Created by
            <a href="https://majorluk.pl" target="_blank" rel="noopener noreferrer" className="hover:text-cs-orange transition-colors">Lukas Majoros</a>. Built by the community, for the community.
          </p>
        </div>
      </div>
    </footer>
  );
}
