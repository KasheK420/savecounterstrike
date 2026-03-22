import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for SaveCounterStrike.com — read before using our community petition platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            TERMS OF{" "}
            <span className="text-cs-orange cs-glow">SERVICE</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-4">
            Last updated: March 22, 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* 1. Acceptance */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using savecounterstrike.com, you agree to be bound
              by these Terms of Service and our{" "}
              <Link
                href="/privacy"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Privacy Policy
              </Link>
              . If you do not agree to these terms, do not use the site.
            </p>
          </div>

          {/* 2. Service Description */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              2. Service Description
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              SaveCounterStrike.com is a community petition platform that
              enables users to sign a petition, submit and vote on opinions,
              upload media submissions, and view community statistics — all in
              support of an open letter to Valve Corporation demanding
              improvements to Counter-Strike 2.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">
                This site is not affiliated with, endorsed by, or sponsored by
                Valve Corporation or Steam.
              </strong>{" "}
              Counter-Strike, Steam, and related trademarks are the property of
              Valve Corporation.
            </p>
          </div>

          {/* 3. User Accounts */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              3. User Accounts
            </h2>
            <ul className="text-muted-foreground space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  Authentication is handled exclusively via{" "}
                  <strong className="text-foreground">
                    Steam OpenID 2.0
                  </strong>
                  . We do not store your Steam password.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  Each Steam account corresponds to one user account on this
                  platform. Duplicate accounts are not permitted.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  You are responsible for all activity that occurs under your
                  account.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  We reserve the right to suspend or permanently ban accounts
                  that violate these terms.
                </span>
              </li>
            </ul>
          </div>

          {/* 4. User-Generated Content */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              4. User-Generated Content
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You retain ownership of any content you submit to the platform.
              By submitting content, you grant SaveCounterStrike.com a
              non-exclusive, worldwide, royalty-free license to display,
              reproduce, and distribute that content on and through the site.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The following content is{" "}
              <strong className="text-foreground">strictly prohibited</strong>:
            </p>
            <ul className="text-muted-foreground space-y-2 leading-relaxed ml-4">
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>Hate speech, racism, or discrimination of any kind</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>Harassment, threats, or targeted abuse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>Spam, advertising, or self-promotion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>Illegal content or content promoting illegal activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>Doxxing or sharing personal information of others</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>Impersonation of other users or public figures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>NSFW, explicit, or sexually suggestive material</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-red mt-0.5 shrink-0">&bull;</span>
                <span>Malware, phishing links, or malicious code</span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              All submitted content defaults to{" "}
              <strong className="text-foreground">PENDING</strong> status and
              may be reviewed by moderators before becoming publicly visible. We
              reserve the right to remove any content at any time without prior
              notice.
            </p>
          </div>

          {/* 5. Petition Signatures */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              5. Petition Signatures
            </h2>
            <ul className="text-muted-foreground space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  When you sign the petition, your{" "}
                  <strong className="text-foreground">
                    Steam display name and avatar
                  </strong>{" "}
                  are displayed publicly on the signatures page.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  If you include an optional message with your signature, it
                  will be filtered for profanity before display.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  You may request removal of your signature at any time by
                  contacting us at{" "}
                  <a
                    href="mailto:contact@savecounterstrike.com"
                    className="text-cs-orange hover:text-cs-orange-light transition-colors"
                  >
                    contact@savecounterstrike.com
                  </a>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-orange mt-0.5 shrink-0">&bull;</span>
                <span>
                  All signatures will be included in the open letter delivered
                  to Valve Corporation on{" "}
                  <strong className="text-foreground">August 31, 2026</strong>.
                </span>
              </li>
            </ul>
          </div>

          {/* 6. Intellectual Property */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              6. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              This project is open source and released under the{" "}
              <strong className="text-foreground">MIT License</strong>. The
              source code is available at{" "}
              <a
                href="https://github.com/KasheK420/savecounterstrike"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                github.com/KasheK420/savecounterstrike
              </a>
              .
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Valve, Steam, Counter-Strike, and Counter-Strike 2 are registered
              trademarks of Valve Corporation. SaveCounterStrike.com claims no
              affiliation with, endorsement by, or connection to Valve
              Corporation.
            </p>
          </div>

          {/* 7. Disclaimers */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              7. Disclaimers
            </h2>
            <ul className="text-muted-foreground space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-cs-gold mt-0.5 shrink-0">&bull;</span>
                <span>
                  This service is provided{" "}
                  <strong className="text-foreground">
                    &ldquo;as is&rdquo;
                  </strong>{" "}
                  and{" "}
                  <strong className="text-foreground">
                    &ldquo;as available&rdquo;
                  </strong>{" "}
                  without warranties of any kind, whether express or implied.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-gold mt-0.5 shrink-0">&bull;</span>
                <span>
                  We do not guarantee that the service will be available at all
                  times or free from errors, interruptions, or security
                  vulnerabilities.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cs-gold mt-0.5 shrink-0">&bull;</span>
                <span>
                  Revenue figures, player statistics, and other data presented
                  on the site are estimates based on publicly available
                  information and should not be treated as exact or official
                  figures.
                </span>
              </li>
            </ul>
          </div>

          {/* 8. Limitation of Liability */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by applicable law,
              SaveCounterStrike.com, its maintainers, and contributors shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages, or any loss of profits, data, or goodwill
              arising out of or in connection with your use of or inability to
              use the service.
            </p>
          </div>

          {/* 9. Changes to These Terms */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              9. Changes to These Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms of Service at any time. Changes will be
              reflected on this page with an updated &ldquo;Last updated&rdquo;
              date. Your continued use of the site after changes are posted
              constitutes your acceptance of the revised terms.
            </p>
          </div>

          {/* 10. Contact */}
          <div className="cs-card rounded-xl p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              10. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, contact us at{" "}
              <a
                href="mailto:contact@savecounterstrike.com"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                contact@savecounterstrike.com
              </a>{" "}
              or visit our{" "}
              <Link
                href="/contact"
                className="text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
