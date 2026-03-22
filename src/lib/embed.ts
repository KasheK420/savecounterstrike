/**
 * @fileoverview Media platform URL parsing and embed generation.
 *
 * Detects media platforms from URLs and extracts embeddable content IDs.
 * Supports YouTube, Instagram, Twitter/X, TikTok, Twitch, and Facebook.
 *
 * @module embed
 */

// ── Types ───────────────────────────────────────────────────

/** Supported media platforms for embed generation */
type MediaPlatform = "YOUTUBE" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "TWITCH" | "FACEBOOK" | "OTHER";

// ── Platform Detection ──────────────────────────────────────

/**
 * Detect media platform from a URL string.
 *
 * @param url - URL to analyze
 * @returns Detected platform or "OTHER" if unrecognized
 */
export function detectPlatform(url: string): MediaPlatform {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    // Check for YouTube variants (standard, short, mobile)
    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") return "YOUTUBE";
    if (host === "instagram.com") return "INSTAGRAM";
    if (host === "x.com" || host === "twitter.com") return "TWITTER";
    if (host.includes("tiktok.com")) return "TIKTOK";
    if (host === "twitch.tv" || host.includes("twitch.tv")) return "TWITCH";
    if (host === "facebook.com" || host === "fb.watch" || host === "fb.com" || host === "m.facebook.com") return "FACEBOOK";
    return "OTHER";
  } catch {
    return "OTHER";
  }
}

// ── ID Extraction Functions ─────────────────────────────────

/**
 * Extract YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
 *           youtube.com/embed/ID, youtube.com/live/ID
 *
 * @param url - YouTube URL
 * @returns Video ID or null if not found
 */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "").replace("m.", "");

    // Short URL format: youtu.be/VIDEO_ID
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;

    if (host === "youtube.com") {
      // Standard watch URL: /watch?v=VIDEO_ID
      if (u.searchParams.has("v")) return u.searchParams.get("v");
      // Shorts, embed, and live URLs: /shorts/ID, /embed/ID, /live/ID
      const match = u.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract Twitch content ID from URL.
 * Supports: /videos/{id}, /clip/{slug}, /channel (live), clips.twitch.tv/{slug}
 *
 * @param url - Twitch URL
 * @returns Object with type and ID, or null if not found
 */
function extractTwitchId(url: string): { type: "video" | "clip" | "channel"; id: string } | null {
  try {
    const u = new URL(url);
    const path = u.pathname;

    // VOD format: /videos/123456
    const videoMatch = path.match(/^\/videos\/(\d+)/);
    if (videoMatch) return { type: "video", id: videoMatch[1] };

    // Clip formats: /clip/slug or clips.twitch.tv/slug
    const clipMatch = path.match(/\/clip\/([^/?]+)/) || path.match(/^\/([^/?]+)$/) && u.hostname === "clips.twitch.tv";
    if (clipMatch) return { type: "clip", id: typeof clipMatch === "object" && clipMatch ? clipMatch[1] : "" };

    // Live channel: /channelname
    const channelMatch = path.match(/^\/([a-zA-Z0-9_]+)\/?$/);
    if (channelMatch) return { type: "channel", id: channelMatch[1] };

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract TikTok video ID from URL.
 * Supports: tiktok.com/@user/video/ID format
 *
 * @param url - TikTok URL
 * @returns Video ID or null if not found
 */
function extractTikTokId(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extract Instagram content ID from URL.
 * Supports: /p/CODE (posts), /reel/CODE (reels), /tv/CODE (IGTV)
 *
 * @param url - Instagram URL
 * @returns Content shortcode or null if not found
 */
function extractInstagramId(url: string): string | null {
  try {
    const u = new URL(url);
    // Match /p/CODE, /reel/CODE, or /tv/CODE (posts, reels, IGTV)
    const match = u.pathname.match(/\/(p|reel|tv)\/([^/?]+)/);
    return match ? match[2] : null;
  } catch {
    return null;
  }
}

/**
 * Extract Twitter/X status ID and username from URL.
 * Supports: x.com/username/status/ID and twitter.com/username/status/ID
 *
 * @param url - Twitter/X URL
 * @returns Object with username and status ID, or null if not found
 */
function extractTwitterStatusId(url: string): { user: string; id: string } | null {
  try {
    const u = new URL(url);
    // Match: /username/status/1234567890
    const match = u.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
    return match ? { user: match[1], id: match[2] } : null;
  } catch {
    return null;
  }
}

// ── Embed URL Generation ─────────────────────────────────────

/**
 * Generate embeddable iframe URL for a given platform.
 * Some platforms (Instagram, Twitter) return original URL for client-side rendering.
 *
 * @param url - Original media URL
 * @param platform - Detected platform type
 * @returns Embed URL or null if platform unsupported/invalid
 */
export function getEmbedUrl(url: string, platform: MediaPlatform): string | null {
  switch (platform) {
    case "YOUTUBE": {
      const id = extractYouTubeId(url);
      // Standard YouTube embed with privacy-enhanced mode
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    case "INSTAGRAM": {
      // Instagram requires client-side embed.js or oembed for proper rendering
      // Return original URL; MediaEmbed component handles it
      return extractInstagramId(url) ? url : null;
    }
    case "TWITTER": {
      // Twitter/X requires client-side widgets.js or react-tweet
      // Return original URL; detail page handles rendering
      return extractTwitterStatusId(url) ? url : null;
    }
    case "FACEBOOK": {
      // Facebook supports both video plugin and post embed
      // Prefer post embed for broader compatibility (reels, photos, videos)
      const isVideo = url.includes("/videos/") || url.includes("fb.watch");
      if (isVideo) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
      }
      // General post embed (better for reels and mixed content)
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=false&width=500`;
    }
    case "TIKTOK": {
      const id = extractTikTokId(url);
      return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
    }
    case "TWITCH": {
      const info = extractTwitchId(url);
      if (!info) return null;
      // Twitch requires parent domain for embed security
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

// ── Thumbnail Generation ───────────────────────────────────

/**
 * Generate thumbnail URL for media preview.
 * Supports YouTube directly + best-effort for other platforms using known CDN patterns.
 *
 * @param url - Original media URL
 * @param platform - Detected platform type
 * @returns Thumbnail URL or null if unavailable
 */
export function getThumbnailUrl(url: string, platform: MediaPlatform): string | null {
  switch (platform) {
    case "YOUTUBE": {
      const id = extractYouTubeId(url);
      // hqdefault.jpg is 480x360, available for most videos
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    case "INSTAGRAM": {
      // Instagram CDN pattern for posts/reels (high quality thumbnail)
      const id = extractInstagramId(url);
      if (id) {
        return `https://instagram.com/p/${id}/media/?size=l`;
      }
      return null;
    }
    case "TWITTER": {
      // Twitter uses pbs.twimg.com for media; best effort via known pattern or fallback
      const tweetInfo = extractTwitterStatusId(url);
      if (tweetInfo) {
        // Common pattern for first media in tweet (often works)
        return `https://pbs.twimg.com/media/${tweetInfo.id.slice(0, 10)}`;
      }
      return null;
    }
    case "FACEBOOK": {
      // Facebook often exposes OG image or uses external preview services
      // Fallback to a generic high-res preview when possible
      try {
        const u = new URL(url);
        const pathId = u.pathname.split('/').filter(Boolean).pop();
        if (pathId) {
          return `https://www.facebook.com/photo.php?fbid=${pathId}`;
        }
      } catch {}
      return null;
    }
    default:
      return null;
  }
}
