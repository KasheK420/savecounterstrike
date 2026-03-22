import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignatureCounter } from "@/components/hero/SignatureCounter";
import { SignPetitionButton } from "@/components/petition/SignPetitionButton";
import { RecentSigners } from "@/components/petition/RecentSigners";
import { NotableSigners } from "@/components/petition/NotableSigners";
import { LetterContent } from "@/components/letter/LetterContent";
import { CountdownTimer } from "@/components/letter/CountdownTimer";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign the Petition",
  description:
    "Add your voice to thousands of CS2 players demanding Valve fix their anti-cheat.",
};

const GOAL = 200000;

export default async function PetitionPage() {
  const session = await auth();
  const userId = session?.user?.userId;

  const [count, alreadySigned] = await Promise.all([
    db.petitionSignature.count(),
    userId
      ? db.petitionSignature
          .findUnique({ where: { userId } })
          .then((s: { id: string } | null) => !!s)
      : false,
  ]);

  const progressPercent = Math.min((count / GOAL) * 100, 100);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-16 cs-gradient">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            SIGN THE <span className="text-cs-orange cs-glow">PETITION</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join the growing movement of Counter-Strike players demanding Valve
            invest in a modern anti-cheat system. Your Steam account is your
            signature — it goes into the open letter delivered on August 31,
            2026.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Counter + Sign + Recent Signers */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — Counter + Sign */}
          <div className="space-y-6">
            <div className="cs-card rounded-xl p-8">
              <SignatureCounter initialCount={count} />
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{count.toLocaleString()} signed</span>
                  <span>Goal: {GOAL.toLocaleString()}</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-muted" />
              </div>
            </div>

            <div className="cs-card rounded-xl p-8">
              <SignPetitionButton alreadySigned={alreadySigned} />
            </div>
          </div>

          {/* Right — Recent signers */}
          <div className="cs-card rounded-xl p-6">
            <RecentSigners />
            <Link
              href="/signatures"
              className="block mt-4 text-center text-xs text-cs-orange hover:text-cs-orange-light transition-colors"
            >
              View all signatures &rarr;
            </Link>
          </div>
        </div>

        {/* Notable Signatures */}
        <NotableSigners />

        {/* The Open Letter + Countdown */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Letter — 3 cols */}
          <div className="lg:col-span-3">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6 text-center lg:text-left">
              THE OPEN{" "}
              <span className="text-cs-orange">LETTER</span>
            </h2>
            <div className="letter-paper rounded-sm p-8 sm:p-12 transform lg:-rotate-[0.8deg]">
              <LetterContent signatureCount={count} />
            </div>
          </div>

          {/* Sidebar — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <CountdownTimer />

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
    </div>
  );
}
