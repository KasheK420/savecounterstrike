import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "What cookies SaveCounterStrike.com uses — spoiler: just one.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            COOKIE{" "}
            <span className="text-cs-orange cs-glow">POLICY</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-4">
            Last updated: March 22, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* What Cookies We Use */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              What Cookies We Use
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              We use exactly <strong className="text-foreground">one</strong> cookie:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 pr-4 font-semibold text-foreground">Purpose</th>
                    <th className="text-left py-3 pr-4 font-semibold text-foreground">Type</th>
                    <th className="text-left py-3 font-semibold text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <code className="text-cs-orange text-xs bg-cs-orange/10 px-1.5 py-0.5 rounded">
                        next-auth.session-token
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      Authentication (keeps you logged in)
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      Strictly necessary, httpOnly, encrypted
                    </td>
                    <td className="py-3 text-muted-foreground">
                      Session (expires on browser close or after 7 days)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* No Tracking */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              No Tracking
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We do <strong className="text-foreground">not</strong> use
              analytics cookies, advertising cookies, or third-party tracking
              cookies. No Google Analytics, no Facebook Pixel, no tracking of
              any kind.
            </p>
          </div>

          {/* Why No Cookie Banner */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Why No Cookie Banner?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our only cookie is classified as &quot;strictly necessary&quot; for
              authentication. Under GDPR and the ePrivacy Directive, strictly
              necessary cookies are exempt from consent requirements. Since we
              have no optional or tracking cookies, there is nothing to consent
              to &mdash; so no banner is needed.
            </p>
          </div>

          {/* Managing Cookies */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Managing Cookies
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You can clear cookies at any time through your browser settings.
              Clearing the{" "}
              <code className="text-cs-orange text-xs bg-cs-orange/10 px-1.5 py-0.5 rounded">
                next-auth.session-token
              </code>{" "}
              cookie will log you out of SaveCounterStrike.com.
            </p>
          </div>

          {/* Contact */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Contact
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Questions about our cookie usage? Email{" "}
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
                href="/privacy"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Privacy Policy
              </Link>
              {" "}&middot;{" "}
              <Link
                href="/terms"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
