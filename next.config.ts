import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
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
              "img-src 'self' data: https://avatars.steamstatic.com https://cdn.cloudflare.steamstatic.com https://i.ytimg.com https://pbs.twimg.com https://*.cdninstagram.com",
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
