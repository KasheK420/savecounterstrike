"use client";

import Script from "next/script";

export function KofiWidget() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="lazyOnload"
      onLoad={() => {
        (window as unknown as Record<string, { draw?: (id: string, opts: Record<string, string>) => void }>).kofiWidgetOverlay?.draw?.("savecounterstrike", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Support us",
          "floating-chat.donateButton.background-color": "#de9b35",
          "floating-chat.donateButton.text-color": "#fff",
        });
      }}
    />
  );
}
