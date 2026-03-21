import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://platform.twitter.com https://www.instagram.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://platform.twitter.com https://www.instagram.com",
              "connect-src 'self' https://platform.twitter.com https://www.instagram.com",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
