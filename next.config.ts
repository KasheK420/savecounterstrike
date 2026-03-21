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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://platform.twitter.com https://cdn.syndication.twimg.com https://www.instagram.com https://www.tiktok.com https://www.facebook.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://platform.twitter.com",
              "img-src 'self' data: https:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://clips.twitch.tv https://platform.twitter.com https://syndication.twitter.com https://www.instagram.com https://www.tiktok.com https://www.facebook.com",
              "connect-src 'self' https://platform.twitter.com https://syndication.twitter.com https://cdn.syndication.twimg.com https://www.instagram.com https://graph.instagram.com https://*.cdninstagram.com https://www.tiktok.com https://www.facebook.com https://graph.facebook.com",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
