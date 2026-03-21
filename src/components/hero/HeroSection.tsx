import Link from "next/link";
import { Shield, ChevronRight, AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { SignatureCounter } from "./SignatureCounter";
import { RevenueTickerHero } from "./RevenueTickerHero";
import { SupporterSlider } from "@/components/shared/SupporterSlider";
import { db } from "@/lib/db";

export async function HeroSection() {
  const signatureCount = await db.petitionSignature.count();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 cs-hero-gradient" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(222,155,53,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(222,155,53,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Message */}
          <div className="relative space-y-8">
            {/* Cheater characters art — right side next to text */}
            <img
              src="/images/dashboard_bg.png"
              alt=""
              aria-hidden="true"
              className="absolute -right-8 top-1/2 -translate-y-[45%] w-[650px] max-w-none opacity-[0.18] pointer-events-none select-none hidden lg:block"
              style={{
                maskImage: "linear-gradient(to left, black 50%, transparent 90%)",
                WebkitMaskImage: "linear-gradient(to left, black 50%, transparent 90%)",
              }}
            />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cs-red/30 bg-cs-red/5 text-cs-red text-sm">
              <AlertTriangle className="h-4 w-4" />
              CS2 has a cheating epidemic
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
              <span className="text-foreground">VALVE,</span>
              <br />
              <span className="text-cs-orange cs-glow">FIX YOUR</span>
              <br />
              <span className="text-foreground">ANTI-CHEAT</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Every day, thousands of Counter-Strike 2 matches are ruined by
              cheaters. Valve earns millions while doing the bare minimum to
              protect the competitive integrity of their game.{" "}
              <strong className="text-foreground">Enough is enough.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/petition"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-cs-orange hover:bg-cs-orange-light text-background font-heading font-bold text-lg px-8 cs-pulse-glow"
                )}
              >
                <Shield className="h-5 w-5 mr-2" />
                Sign the Petition
                <ChevronRight className="h-5 w-5 ml-1" />
              </Link>
              <Link
                href="/videos"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-border/50 text-muted-foreground hover:text-foreground hover:border-cs-orange/30"
                )}
              >
                Watch Cheater Clips
              </Link>
            </div>
          </div>

          {/* Right — Stats */}
          <div className="space-y-6">
            <div className="cs-card rounded-xl p-8">
              <SignatureCounter initialCount={signatureCount} />
            </div>

            <RevenueTickerHero />
          </div>
        </div>

        {/* Supporter logos */}
        <SupporterSlider />
      </div>
    </section>
  );
}
