import { db } from "@/lib/db";
import { CountdownTimer } from "./CountdownTimer";
import { LetterContent } from "./LetterContent";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

export async function OpenLetter() {
  const signatureCount = await db.petitionSignature.count();

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-cs-navy/20 to-background" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            THE OPEN{" "}
            <span className="text-cs-orange cs-glow">LETTER</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            On August 31, 2026, we will deliver this letter to Valve
            Corporation — signed by every player who refuses to stay silent.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Letter — takes 3 cols */}
          <div className="lg:col-span-3">
            <div className="letter-paper rounded-sm p-8 sm:p-12 transform lg:-rotate-[0.8deg]">
              <LetterContent signatureCount={signatureCount} />
            </div>
          </div>

          {/* Sidebar — countdown + CTA — takes 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <CountdownTimer />

            <div className="cs-card rounded-xl p-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Add your name to this letter. Every signature counts.
              </p>
              <Link
                href="/petition"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full bg-cs-orange hover:bg-cs-orange-light text-background font-heading font-bold cs-pulse-glow"
                )}
              >
                <Shield className="h-5 w-5 mr-2" />
                Sign the Letter
              </Link>
            </div>

            {/* Broader scope callout */}
            <div className="cs-card rounded-xl p-6 space-y-3">
              <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
                Not just about cheaters
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This letter carries the voice of the entire community. Broken
                features, ignored requests, missing communication — years of
                &ldquo;do nothing and win&rdquo; end here. Your opinions and
                votes shape what goes into this letter.
              </p>
              <Link
                href="/opinions"
                className="text-xs text-cs-orange hover:text-cs-orange-light transition-colors"
              >
                Submit your community request &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
