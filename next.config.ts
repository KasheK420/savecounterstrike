import type { NextConfig } from "next";
import { execFileSync } from "child_process";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const gitSha = process.env.GIT_SHA?.slice(0, 7) || (() => {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();
  } catch {
    return "dev";
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_SHA: gitSha,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://platform.twitter.com https://platform.x.com https://connect.facebook.net https://www.instagram.com https://storage.ko-fi.com",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: https://pbs.twimg.com https://abs.twimg.com https://*.instagram.com https://*.fbcdn.net https://scontent.cdninstagram.com",
              "media-src 'self' https:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://clips.twitch.tv https://www.tiktok.com https://www.instagram.com https://www.facebook.com https://platform.twitter.com https://platform.x.com https://syndication.twitter.com https://cdn.syndication.twimg.com https://x.com https://twitter.com https://*.instagram.com https://*.facebook.com",
              "connect-src 'self' https: https://api.x.com https://syndication.x.com",
              "font-src 'self'",
            ].join("; "),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
