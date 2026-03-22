import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SaveCounterStrike.com collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            PRIVACY{" "}
            <span className="text-cs-orange cs-glow">POLICY</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-4">
            Last updated: March 22, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* What We Collect */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              What We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Via Steam OpenID (authentication)
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Steam ID (stored internally, masked in public-facing pages and API responses)</li>
                  <li>Display name</li>
                  <li>Avatar URL</li>
                  <li>Profile URL</li>
                  <li>Profile visibility setting</li>
                </ul>
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Via Steam API (game data)
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>CS2 ownership status</li>
                  <li>Playtime hours</li>
                  <li>Kills, deaths, wins, headshot percentage</li>
                </ul>
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Via FACEIT API (client-side only)
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>FACEIT level (1&ndash;10)</li>
                  <li>ELO rating</li>
                </ul>
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  User-submitted content
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Petition messages (optional)</li>
                  <li>Opinions, comments, and votes</li>
                  <li>Media URLs (cheater clip submissions)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Contact form
                </h3>
                <p className="ml-2">
                  Name, email, subject, and message &mdash; sent via email only,{" "}
                  <strong className="text-foreground">not stored in our database</strong>.
                </p>
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Technical data
                </h3>
                <p className="ml-2">
                  IP addresses for rate limiting purposes only (held in-memory, not persisted to disk or database).
                </p>
              </div>
            </div>
          </div>

          {/* What We Don't Collect */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              What We Don&apos;t Collect
            </h2>
            <ul className="list-disc list-inside text-muted-foreground text-sm leading-relaxed space-y-1 ml-2">
              <li>Passwords (Steam handles authentication entirely)</li>
              <li>Payment information</li>
              <li>Email addresses (Steam does not provide them via OpenID)</li>
              <li>Browser fingerprints</li>
              <li>Location data</li>
            </ul>
          </div>

          {/* How We Use Data */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              How We Use Data
            </h2>
            <ul className="list-disc list-inside text-muted-foreground text-sm leading-relaxed space-y-1 ml-2">
              <li>Display petition signatures on the signatures page</li>
              <li>Show community opinions and allow voting</li>
              <li>Calculate and display community statistics</li>
              <li>Moderate user-submitted content</li>
              <li>Prevent abuse via rate limiting</li>
            </ul>
          </div>

          {/* Data Privacy Measures */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Data Privacy Measures
            </h2>
            <ul className="list-disc list-inside text-muted-foreground text-sm leading-relaxed space-y-2 ml-2">
              <li>
                Steam IDs and display names are masked on public pages
                (e.g., &quot;Lu****&quot;, &quot;7656****5678&quot;)
              </li>
              <li>Full Steam IDs are never exposed in public API responses</li>
              <li>JWT-based sessions &mdash; no server-side session storage</li>
              <li>All data transmitted over HTTPS via Cloudflare</li>
            </ul>
          </div>

          {/* Cookies */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Cookies
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We use <strong className="text-foreground">one cookie</strong>:{" "}
              <code className="text-cs-orange text-xs bg-cs-orange/10 px-1.5 py-0.5 rounded">
                next-auth.session-token
              </code>{" "}
              &mdash; a strictly necessary, httpOnly, encrypted authentication cookie.
              No analytics cookies, no tracking cookies, no third-party cookies.
              See our{" "}
              <Link
                href="/cookies"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Cookie Policy
              </Link>{" "}
              for details.
            </p>
          </div>

          {/* Third-Party Services */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Third-Party Services
            </h2>
            <ul className="list-disc list-inside text-muted-foreground text-sm leading-relaxed space-y-1 ml-2">
              <li>
                <strong className="text-foreground">Steam API</strong> &mdash;
                authentication and game data
              </li>
              <li>
                <strong className="text-foreground">FACEIT API</strong> &mdash;
                competitive stats (fetched client-side)
              </li>
              <li>
                <strong className="text-foreground">Cloudflare</strong> &mdash;
                CDN and DDoS protection
              </li>
              <li>
                <strong className="text-foreground">DockerHub</strong> &mdash;
                deployment infrastructure
              </li>
            </ul>
          </div>

          {/* Data Retention */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Data Retention
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your data is retained until you request deletion or remove your
              signature. To request deletion of all your data, contact us at{" "}
              <a
                href="mailto:contact@savecounterstrike.com"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                contact@savecounterstrike.com
              </a>
              .
            </p>
          </div>

          {/* Your Rights */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Your Rights
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-sm leading-relaxed space-y-1 ml-2">
              <li>Request access to the data we hold about you</li>
              <li>Request deletion of your data</li>
              <li>Request removal of your petition signature</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed mt-2">
              For any of these requests, email{" "}
              <a
                href="mailto:contact@savecounterstrike.com"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                contact@savecounterstrike.com
              </a>
              .
            </p>
          </div>

          {/* Children */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Children
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This website is not intended for users under the age of 13, which
              is Steam&apos;s minimum age requirement. We do not knowingly collect
              data from children under 13.
            </p>
          </div>

          {/* Changes */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Changes to This Policy
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We may update this privacy policy from time to time. Check this
              page for the latest version. The &quot;last updated&quot; date at the top
              reflects the most recent changes.
            </p>
          </div>

          {/* Contact */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Contact
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If you have any questions about this privacy policy, contact us
              at{" "}
              <a
                href="mailto:contact@savecounterstrike.com"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                contact@savecounterstrike.com
              </a>
              .
            </p>
            <p className="text-muted-foreground text-sm mt-3">
              See also:{" "}
              <Link
                href="/terms"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Terms of Service
              </Link>
              {" "}&middot;{" "}
              <Link
                href="/cookies"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Cookie Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
