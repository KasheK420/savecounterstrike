import type { Metadata } from "next";
import Image from "next/image";
import { Heart, Coffee, Server, Clock } from "lucide-react";
import { CryptoAddress } from "@/components/support/CryptoAddress";

export const metadata: Metadata = {
  title: "Support Us",
  description:
    "Help keep SaveCounterStrike.com running. Every contribution covers server costs and development time.",
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
            SUPPORT <span className="text-cs-orange cs-glow">US</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
            SaveCounterStrike.com is free, ad-free, and community-funded. If
            you find this project valuable, consider buying us a coffee.
          </p>
        </div>

        {/* What it covers */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
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
            <Coffee className="h-6 w-6 text-cs-orange mx-auto mb-2" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Coffee Fuel
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Keeping the team going
            </p>
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

        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
            All donations go directly toward server costs and development of
            SaveCounterStrike.com. This is a community project — we don&apos;t
            profit from it. Donations are voluntary and non-refundable. Thank
            you for your support.
          </p>
        </div>
      </div>
    </div>
  );
}
