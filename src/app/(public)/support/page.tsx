import type { Metadata } from "next";
import Image from "next/image";
import { Heart, Coffee, Server, Clock, Users, Code, Globe, HandHeart } from "lucide-react";
import { CryptoAddress } from "@/components/support/CryptoAddress";
import { SupporterList } from "@/components/support/SupporterList";

export const metadata: Metadata = {
  title: "Help Cover Costs",
  description:
    "SaveCounterStrike.com is a not-for-profit community project. Contributions cover server costs, domain, and community events — no one profits personally.",
};

const CRYPTO_WALLETS = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    address: "bc1qeqfkhq0zsjlcffsgpl0tzxc7u7cny9dx5jwh4c",
    color: "text-[#f7931a]",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    address: "0x219989D38960b1B0113F80481d38f9387d39F3e5",
    color: "text-[#627eea]",
  },
  {
    name: "USDT / USDC",
    symbol: "ERC20",
    address: "0x219989D38960b1B0113F80481d38f9387d39F3e5",
    color: "text-[#26a17b]",
  },
  {
    name: "Solana",
    symbol: "SOL",
    address: "HDVPSHbrRFpGcNxXDRN5aG9Pb3cQgWEcnyerZotfsfey",
    color: "text-[#9945ff]",
  },
  {
    name: "XRP",
    symbol: "XRP",
    address: "rPhp4gNSFJFRqBqpttMsA1vuC44mH2bX8t",
    color: "text-[#00aae4]",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="h-12 w-12 text-cs-red mx-auto mb-4" />
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">
            HELP COVER{" "}
            <span className="text-cs-orange cs-glow">COSTS</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
            SaveCounterStrike.com is free, ad-free, and community-funded. Every
            contribution keeps the lights on — nothing more, nothing less.
          </p>
        </div>

        {/* Community-first statement */}
        <div className="cs-card rounded-xl p-8 mb-12 border border-cs-orange/20 bg-cs-orange/[0.03]">
          <div className="flex items-start gap-5">
            <div className="shrink-0 mt-1">
              <Users className="h-10 w-10 text-cs-orange" />
            </div>
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                This Is a Community Project, Not a Business
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We built SaveCounterStrike because we love Counter-Strike and
                we&apos;re tired of watching cheaters destroy it. That&apos;s
                it. No company behind this, no investors, no monetization
                scheme. Just players who want the game fixed.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-start gap-3">
                  <Server className="h-5 w-5 text-cs-blue shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Running costs</strong>{" "}
                    — server hosting, domain, database, CDN
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-cs-green shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Community events</strong>{" "}
                    — tournaments, giveaways, meetups
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-cs-gold shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Development tools</strong>{" "}
                    — services and resources to build and improve the site
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <HandHeart className="h-5 w-5 text-cs-red shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Any surplus</strong>{" "}
                    — reinvested into prizes, events, and community tools
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground border-t border-border/50 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cs-green" />
                  Open source code — anyone can verify
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cs-green" />
                  Public roadmap
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cs-green" />
                  No one profits personally
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What contributions cover */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="cs-card rounded-lg p-5 text-center">
            <Server className="h-6 w-6 text-cs-blue mx-auto mb-2" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Server Hosting
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              VPS, domain, database, CDN
            </p>
          </div>
          <div className="cs-card rounded-lg p-5 text-center">
            <Clock className="h-6 w-6 text-cs-gold mx-auto mb-2" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Development Time
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Features, maintenance, fixes
            </p>
          </div>
          <div className="cs-card rounded-lg p-5 text-center">
            <Users className="h-6 w-6 text-cs-green mx-auto mb-2" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Community Events
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tournaments, giveaways, prizes
            </p>
          </div>
          <div className="cs-card rounded-lg p-5 text-center">
            <Coffee className="h-6 w-6 text-cs-orange mx-auto mb-2" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Coffee Fuel
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Keeping the team going
            </p>
          </div>
        </div>

        {/* Ko-fi + Discord */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="cs-card rounded-xl p-8 text-center space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Buy Us a Coffee
            </h2>
            <p className="text-sm text-muted-foreground">
              The easiest way to help cover costs — one-time or monthly, with
              community perks as a thank-you.
            </p>
            <a
              href="https://ko-fi.com/savecounterstrike"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-cs-orange hover:bg-cs-orange-light text-background transition-colors"
            >
              <Coffee className="h-5 w-5" />
              Help Out on Ko-fi
            </a>
          </div>
          <div className="cs-card rounded-xl p-8 text-center space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Join the Community
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect with other players, unlock supporter perks, and shape the movement.
            </p>
            <a
              href="https://discord.gg/zwBzCN6CE5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors"
            >
              Discord Server
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* PayPal */}
          <div className="cs-card rounded-xl p-8 text-center space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">
              PayPal
            </h2>
            <p className="text-sm text-muted-foreground">
              Scan the QR code or send to:
            </p>

            <div className="inline-block bg-white p-3 rounded-lg">
              <Image
                src="/images/paypal-qr.png"
                alt="PayPal QR Code"
                width={200}
                height={200}
                className="rounded"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <a
                href="https://paypal.me/majorluk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cs-orange hover:text-cs-orange-light transition-colors font-medium"
              >
                majoros.lukas1@gmail.com
              </a>
            </div>
          </div>

          {/* Crypto */}
          <div className="cs-card rounded-xl p-8 space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground text-center">
              Crypto
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              Click to copy address
            </p>

            <div className="space-y-3">
              {CRYPTO_WALLETS.map((wallet) => (
                <CryptoAddress key={wallet.symbol} {...wallet} />
              ))}
            </div>
          </div>
        </div>

        {/* Supporters */}
        <div className="mt-8">
          <SupporterList />
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
            SaveCounterStrike is a not-for-profit community project. All
            contributions go toward server costs, development, and community
            events. Surplus funds are reinvested into tools, prizes, and
            resources for the CS2 community — no one profits personally.
            Contributions are voluntary and non-refundable.
          </p>
        </div>
      </div>
    </div>
  );
}
