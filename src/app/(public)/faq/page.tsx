"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown, Shield, FileText, BarChart3, Users, Lock } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  icon: React.ElementType;
  color: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: "General",
    icon: HelpCircle,
    color: "text-cs-orange",
    items: [
      {
        q: "What is SaveCounterStrike.com?",
        a: "SaveCounterStrike.com is a community-driven platform created to unite Counter-Strike players and demand meaningful change from Valve Corporation. We collect signatures, community opinions, and evidence to build a case that Valve can't ignore. On August 31, 2026, we will deliver an open letter with all signatures directly to Valve.",
      },
      {
        q: "Is this affiliated with Valve Corporation?",
        a: "No. This website is not affiliated with, endorsed by, or sponsored by Valve Corporation in any way. Counter-Strike is a trademark of Valve Corporation. This is an independent community initiative.",
      },
      {
        q: "Who runs this project?",
        a: "The project was founded by Lukas Majoros and is maintained by volunteer contributors. It's fully open source — anyone can contribute, audit the code, or suggest improvements via our GitHub repository.",
      },
      {
        q: "Is this open source?",
        a: "Yes! The entire codebase is publicly available on GitHub at github.com/KasheK420/savecounterstrike. We believe in transparency — you can see exactly how the site works, what data we collect, and how we calculate our statistics.",
      },
    ],
  },
  {
    title: "The Open Letter",
    icon: FileText,
    color: "text-cs-gold",
    items: [
      {
        q: "What happens on August 31, 2026?",
        a: "On this date, we will compile the open letter with every petition signature attached, along with the top-voted community opinions and suggestions. This will be delivered directly to Valve Corporation. After delivery, we will publish Valve's response — or document their silence.",
      },
      {
        q: "What is the open letter about?",
        a: "The letter addresses years of community frustration — not just cheating, but ignored feature requests, lack of communication, and insufficient investment in the game relative to the revenue it generates. It demands specific actions: modern anti-cheat, hardware bans, transparent communication, and community-requested features.",
      },
      {
        q: "How will the letter be delivered?",
        a: "The letter will be sent both digitally (email to Valve's official channels) and physically (printed and mailed to Valve's headquarters in Bellevue, Washington). We will also publish it publicly and share it across social media and gaming press.",
      },
    ],
  },
  {
    title: "Petition",
    icon: Shield,
    color: "text-cs-orange",
    items: [
      {
        q: "How do I sign the petition?",
        a: "There are three ways: 1) Create an account with your email and sign in, 2) Sign in directly with your Steam account for a fully verified signature, or 3) Enter your Steam profile URL or Steam64 ID without logging in. Methods 1 and 2 give full verification. You can also link your Steam account to your email account later in your profile settings.",
      },
      {
        q: "Who can see my signature?",
        a: "Your Steam display name and avatar are shown publicly on the petition page. Your Steam ID is not exposed in public API responses. Your CS2 playtime and stats may be shown as badges next to your name if your Steam profile is public.",
      },
      {
        q: "Can I remove my signature?",
        a: "Contact us if you'd like your signature removed. Admins can remove signatures from the admin panel. Once removed, you're free to sign again if you change your mind.",
      },
    ],
  },
  {
    title: "Account & Security",
    icon: Lock,
    color: "text-cs-blue",
    items: [
      {
        q: "How do I create an account?",
        a: "You can register with your email address and a password, or sign in instantly with your Steam account. Both methods are equal — you get full access either way. If you register with email, you'll need to verify your email address before you can post content.",
      },
      {
        q: "Can I link my Steam account to my email account?",
        a: "Yes! Go to your profile settings (click your avatar → Edit Profile → Security tab). You can link your Steam account to your email account, or add an email and password to your Steam account. This gives you two ways to sign in and lets you recover your account if you lose access to one method.",
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: "Click 'Forgot password?' on the login page and enter your email. You'll receive a reset link valid for 30 minutes. If you don't see the email, check your spam folder. For security, we don't confirm whether the email exists in our system.",
      },
      {
        q: "What is Two-Factor Authentication (MFA)?",
        a: "MFA adds an extra layer of security to your account. After enabling it in your profile settings, you'll need to enter a 6-digit code from an authenticator app (like Google Authenticator or Authy) each time you sign in. MFA is optional for regular users but mandatory for moderators and administrators.",
      },
      {
        q: "What if I lose access to my authenticator app?",
        a: "When you set up MFA, you receive 10 one-time recovery codes. Each code can be used once to sign in without your authenticator. Store these codes somewhere safe — we cannot recover them for you. If you've used all recovery codes, contact us for manual account recovery.",
      },
      {
        q: "Is my password stored securely?",
        a: "Yes. We use bcrypt with 12 rounds of hashing — your password is never stored in plain text. We also check new passwords against the Have I Been Pwned database to prevent you from using passwords that have appeared in known data breaches. All authentication tokens are hashed with SHA-256 before storage.",
      },
      {
        q: "How do I merge two accounts?",
        a: "If you accidentally created separate accounts (one via Steam, one via email), you can merge them by linking the other identity in your profile settings. When a conflict is detected, we'll walk you through the merge process — all your content (opinions, comments, votes) will be transferred to your main account.",
      },
    ],
  },
  {
    title: "Revenue & Statistics",
    icon: BarChart3,
    color: "text-cs-green",
    items: [
      {
        q: "How are the revenue numbers calculated?",
        a: "Revenue estimates are based on publicly available data: Steam Community Market transaction volumes (via Steam's API), case opening counts tracked by CSFloat/FloatDB, and analysis from BitSkins and community researchers. Key price ($2.50) × daily case openings gives key revenue. Steam's 15% market fee on ~$1.22B annual transactions gives market fee revenue.",
      },
      {
        q: "Where does the data come from?",
        a: "Player counts come from the official Steam Web API. Case market volumes are queried from Steam Community Market's price overview endpoint. Baseline estimates reference the BitSkins March 2025 analysis (~$82M/month from cases) and ZestyJesus's 2025 yearly analysis ($1.22B in market transactions). All sources are cited on the revenue page.",
      },
    ],
  },
  {
    title: "Community",
    icon: Users,
    color: "text-cs-blue",
    items: [
      {
        q: "Can I submit my own opinion or suggestion?",
        a: "Yes! Go to the Opinions page and click 'Submit your opinion.' You'll need to sign in first — either with your email account or via Steam. You can write formatted text with our rich editor, add images, and explain what you think Valve should change. The top-voted opinions will be included in the open letter.",
      },
      {
        q: "How does voting work?",
        a: "Every logged-in user can upvote or downvote opinions and comments. The score (upvotes minus downvotes) determines the ranking. Opinions with the highest scores appear first when sorting by 'Best' and are considered for inclusion in the open letter to Valve.",
      },
      {
        q: "How can I support the project?",
        a: "There are several ways: sign the petition, submit and vote on opinions, share the site with other CS2 players, contribute to the codebase on GitHub, join our Discord community, or help cover server costs with a tip on our Support page (Ko-fi, PayPal, or crypto).",
      },
      {
        q: "How do I join the Discord?",
        a: "Join our Discord server at discord.gg/zwBzCN6CE5 — it's the central hub for the SaveCounterStrike community. Chat with other players, get early access to new features, and if you're a Ko-fi supporter, unlock exclusive channels and perks based on your membership tier.",
      },
    ],
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left cs-card rounded-lg overflow-hidden transition-all hover:border-cs-orange/20"
    >
      <div className="flex items-center justify-between p-4 gap-3">
        <span className="text-sm font-medium text-foreground">{item.q}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            {item.a}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <HelpCircle className="h-12 w-12 text-cs-orange mx-auto mb-4 opacity-60" />
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            <span className="text-cs-orange">FAQ</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-3">
            Frequently asked questions about SaveCounterStrike.com
          </p>
        </div>

        <div className="space-y-10">
          {FAQ_DATA.map((category) => (
            <div key={category.title}>
              <div className="flex items-center gap-2 mb-4">
                <category.icon className={`h-5 w-5 ${category.color}`} />
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {category.title}
                </h2>
              </div>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <FaqAccordion key={item.q} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center cs-card rounded-xl p-8">
          <p className="text-muted-foreground mb-3">
            Still have questions?
          </p>
          <Link
            href="/contact"
            className="text-cs-orange hover:text-cs-orange-light transition-colors text-sm"
          >
            Contact us &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
