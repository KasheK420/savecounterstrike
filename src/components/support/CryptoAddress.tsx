"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CryptoAddressProps {
  name: string;
  symbol: string;
  address: string;
  color: string;
}

export function CryptoAddress({
  name,
  symbol,
  address,
  color,
}: CryptoAddressProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-cs-orange/20 transition-all text-left group"
    >
      <div className="shrink-0">
        <span className={`font-heading font-bold text-sm ${color}`}>
          {symbol}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{name}</div>
        <div className="text-xs font-mono text-foreground/80 truncate">
          {address}
        </div>
      </div>
      <div className="shrink-0">
        {copied ? (
          <Check className="h-4 w-4 text-cs-green" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground group-hover:text-cs-orange transition-colors" />
        )}
      </div>
    </button>
  );
}
