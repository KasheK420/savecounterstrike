type MediaPlatform = "YOUTUBE" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "TWITCH" | "OTHER";

export function detectPlatform(url: string): MediaPlatform {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") return "YOUTUBE";
    if (host === "instagram.com") return "INSTAGRAM";
    if (host === "x.com" || host === "twitter.com") return "TWITTER";
    if (host.includes("tiktok.com")) return "TIKTOK";
    if (host === "twitch.tv" || host.includes("twitch.tv")) return "TWITCH";
    return "OTHER";
  } catch {
    return "OTHER";
  }
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "").replace("m.", "");

    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com") {
      // /watch?v=ID
      if (u.searchParams.has("v")) return u.searchParams.get("v");
      // /shorts/ID or /embed/ID or /live/ID
      const match = u.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

function extractTwitchId(url: string): { type: "video" | "clip" | "channel"; id: string } | null {
  try {
    const u = new URL(url);
    const path = u.pathname;

    // /videos/123456
    const videoMatch = path.match(/^\/videos\/(\d+)/);
    if (videoMatch) return { type: "video", id: videoMatch[1] };

    // /user/clip/slug or clips.twitch.tv/slug
    const clipMatch = path.match(/\/clip\/([^/?]+)/) || path.match(/^\/([^/?]+)$/) && u.hostname === "clips.twitch.tv";
    if (clipMatch) return { type: "clip", id: typeof clipMatch === "object" && clipMatch ? clipMatch[1] : "" };

    // /channelname (live stream)
    const channelMatch = path.match(/^\/([a-zA-Z0-9_]+)\/?$/);
    if (channelMatch) return { type: "channel", id: channelMatch[1] };

    return null;
  } catch {
    return null;
  }
}

function extractTikTokId(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function extractInstagramId(url: string): string | null {
  try {
    const u = new URL(url);
    // /p/CODE/ or /reel/CODE/
    const match = u.pathname.match(/^\/(p|reel|tv)\/([^/?]+)/);
    return match ? match[2] : null;
  } catch {
    return null;
  }
}

function extractTwitterStatusId(url: string): { user: string; id: string } | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
    return match ? { user: match[1], id: match[2] } : null;
  } catch {
    return null;
  }
}

export function getEmbedUrl(url: string, platform: MediaPlatform): string | null {
  switch (platform) {
    case "YOUTUBE": {
      const id = extractYouTubeId(url);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    case "INSTAGRAM": {
      const id = extractInstagramId(url);
      return id ? `https://www.instagram.com/p/${id}/embed` : null;
    }
    case "TWITTER": {
      // Twitter doesn't have a simple iframe embed — we use the original URL
      // and render via blockquote + widgets.js on the client
      return url;
    }
    case "TIKTOK": {
      const id = extractTikTokId(url);
      return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
    }
    case "TWITCH": {
      const info = extractTwitchId(url);
      if (!info) return null;
      const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
      if (info.type === "video") return `https://player.twitch.tv/?video=${info.id}&parent=${parent}&autoplay=false`;
      if (info.type === "clip") return `https://clips.twitch.tv/embed?clip=${info.id}&parent=${parent}&autoplay=false`;
      if (info.type === "channel") return `https://player.twitch.tv/?channel=${info.id}&parent=${parent}&autoplay=false`;
      return null;
    }
    default:
      return null;
  }
}

export function getThumbnailUrl(url: string, platform: MediaPlatform): string | null {
  switch (platform) {
    case "YOUTUBE": {
      const id = extractYouTubeId(url);
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    default:
      return null;
  }
}
