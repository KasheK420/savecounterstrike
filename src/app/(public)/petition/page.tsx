import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignatureCounter } from "@/components/hero/SignatureCounter";
import { SignPetitionButton } from "@/components/petition/SignPetitionButton";
import { RecentSigners } from "@/components/petition/RecentSigners";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Sign the Petition",
  description:
    "Add your voice to thousands of CS2 players demanding Valve fix their anti-cheat.",
};

const GOAL = 10000;

export default async function PetitionPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId;

  const [count, alreadySigned] = await Promise.all([
    db.petitionSignature.count(),
    userId
      ? db.petitionSignature
          .findUnique({ where: { userId } })
          .then((s) => !!s)
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
            signature.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — Counter + Sign */}
          <div className="space-y-8">
            <div className="cs-card rounded-xl p-8">
              <SignatureCounter initialCount={count} />
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{count.toLocaleString()} signed</span>
                  <span>Goal: {GOAL.toLocaleString()}</span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 bg-muted"
                />
              </div>
            </div>

            <div className="cs-card rounded-xl p-8">
              <SignPetitionButton alreadySigned={alreadySigned} />
            </div>
          </div>

          {/* Right — Recent signers */}
          <div className="cs-card rounded-xl p-6">
            <RecentSigners />
          </div>
        </div>

        {/* Petition text */}
        <div className="mt-12 cs-card rounded-xl p-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            THE <span className="text-cs-orange">PETITION</span>
          </h2>
          <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">To Valve Corporation,</strong>
            </p>
            <p>
              We, the undersigned members of the Counter-Strike community,
              demand immediate and substantial action to address the rampant
              cheating problem in Counter-Strike 2.
            </p>
            <p>
              Counter-Strike has been one of the most iconic competitive
              shooters for over two decades, and the community has supported
              Valve through billions of dollars in microtransactions, market
              fees, and game sales. In return, we expect a fair competitive
              environment.
            </p>
            <p>
              <strong className="text-foreground">We demand:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                Implementation of a modern, kernel-level anti-cheat system on
                par with industry standards
              </li>
              <li>
                Dramatically faster detection and banning of cheaters — response
                times in days, not months
              </li>
              <li>
                Hardware identification and bans for repeat offenders to prevent
                them from creating new accounts
              </li>
              <li>
                A transparent reporting system that provides feedback when
                reports result in action
              </li>
              <li>
                Regular public communications about anti-cheat improvements and
                ban statistics
              </li>
              <li>
                Dedicated resources and team investment proportional to the
                revenue Counter-Strike generates
              </li>
            </ol>
            <p>
              The current state of anti-cheat in CS2 is unacceptable. Players
              are leaving. Trust is eroding. The competitive scene suffers. We
              love this game and want to see it thrive, but that requires Valve
              to take this problem seriously.
            </p>
            <p>
              <strong className="text-foreground">
                Signed by the Counter-Strike community.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
