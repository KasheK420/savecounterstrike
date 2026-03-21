"use client";

import { useEffect, useState } from "react";

interface LetterContentProps {
  signatureCount: number;
}

export function LetterContent({ signatureCount }: LetterContentProps) {
  const [revenue, setRevenue] = useState({ yearly: "$1+ billion", daily: "$3+ million" });

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/revenue");
        const data = await res.json();
        if (data.yearlyRevenue) {
          setRevenue({
            yearly: `$${(data.yearlyRevenue / 1_000_000_000).toFixed(2)} billion`,
            daily: `$${(data.dailyTotalRevenue / 1_000_000).toFixed(1)} million`,
          });
        }
      } catch {
        // Use defaults
      }
    }
    fetchRevenue();
  }, []);

  return (
    <div className="relative z-10">
      {/* Date */}
      <div className="text-right mb-8">
        <span className="font-serif text-sm text-[#6b5e50] italic">
          August 31, 2026
        </span>
      </div>

      {/* Salutation */}
      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#2a2520] mb-8">
        Dear Valve Corporation,
      </h3>

      {/* Body — handwriting font */}
      <div className="font-handwriting text-lg sm:text-xl leading-relaxed text-[#2a2520] space-y-6">
        <p>
          For years, we — the Counter-Strike community — have watched in silence
          as you collected billions from our passion while giving back the bare
          minimum.
        </p>

        <p>
          We trusted you. We bought your keys, traded on your market, watched
          your Majors, and defended your name. In return, we got an anti-cheat
          system that hasn&apos;t meaningfully evolved in over a decade. We got
          ignored bug reports, unanswered community requests, and silence.
        </p>

        <p>
          Let&apos;s talk numbers. Counter-Strike 2 generates an estimated{" "}
          <strong className="text-[#8b1a1a]">{revenue.yearly}</strong> per year —{" "}
          <strong className="text-[#8b1a1a]">{revenue.daily}</strong> every
          single day — from case keys, market fees, and microtransactions. That
          money comes from us. From every key we buy, every skin we trade, every
          hour we invest in your game.
        </p>

        <p>And what do we get in return?</p>

        <p>
          Cheaters in every other match. A VAC system so outdated that free
          cheats bypass it within hours. No hardware bans. No transparency. No
          communication. No accountability.
        </p>

        {/* Community demands placeholder */}
        <div className="my-6 py-4 px-5 border-l-3 border-[#8b1a1a]/40 bg-[#e8e0d0]/50 rounded-r">
          <p className="font-serif text-sm font-semibold text-[#4a3f35] mb-3 not-italic">
            The community demands:
          </p>
          <ul className="space-y-2 text-base">
            <li>&#x2022; A modern, kernel-level anti-cheat system</li>
            <li>&#x2022; Hardware bans for repeat offenders</li>
            <li>&#x2022; Faster detection — days, not months</li>
            <li>&#x2022; Transparent communication about anti-cheat efforts</li>
            <li>&#x2022; Feedback when player reports lead to bans</li>
            <li className="pt-2 text-[#6b5e50] text-sm italic">
              + community-voted requests coming soon...
            </li>
          </ul>
        </div>

        <p>
          But this isn&apos;t just about cheaters anymore. It&apos;s about years of
          neglected features, broken promises, and a community that feels
          abandoned by the company that should be its biggest champion. Players
          have been requesting basic improvements for years — and receiving
          nothing but silence.
        </p>

        <p>
          You can&apos;t <em>&ldquo;do nothing and win&rdquo;</em> forever.
        </p>

        <p>
          On August 31, 2026, we will deliver this letter — with every signature
          attached — directly to your offices. And then we will publish your
          response.
        </p>

        <p className="font-bold text-[#2a2520]">
          Or your silence. The world will see either way.
        </p>

        <p>The choice is yours.</p>
      </div>

      {/* Signature */}
      <div className="mt-10 pt-6 border-t border-[#d4c9b0]">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-handwriting text-lg text-[#4a3f35]">
              With urgency and resolve,
            </p>
            <p className="font-handwriting text-2xl font-bold text-[#2a2520] mt-2">
              Lukas Majoros
            </p>
            <p className="font-serif text-xs text-[#6b5e50] italic">
              on behalf of the Counter-Strike community
            </p>
            <p className="font-serif text-sm text-[#8b1a1a] mt-1 font-semibold">
              {signatureCount.toLocaleString()} signatures and counting
            </p>
          </div>

          {/* Wax seal */}
          <div className="wax-seal shrink-0 ml-4">
            CS
          </div>
        </div>
      </div>
    </div>
  );
}
