/**
 * @fileoverview Page view analytics tracking.
 *
 * Records page views for analytics with bot detection, IP hashing for privacy,
 * and device/browser/OS parsing. Called from the proxy on each request.
 *
 * @module tracking
 */

import { createHash } from "crypto";
import { db } from "@/lib/db";

// ── Configuration ───────────────────────────────────────────

/**
 * Regex pattern to detect bot/crawler user agents.
 * Blocks recording of automated traffic to keep analytics accurate.
 */
const BOT_PATTERNS = /bot|crawler|spider|googlebot|bingbot|slurp|duckduckbot|baidu|yandex|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot/i;

/**
 * Paths to exclude from tracking (API routes, static assets, internal).
 */
const IGNORE_PATHS = /^\/(api|_next|images|favicon|robots|sitemap)/;

// ── User Agent Parsing ─────────────────────────────────────

/**
 * Parse user agent string to extract device, browser, and OS.
 * Uses regex matching for common patterns.
 *
 * @param ua - Raw user agent string
 * @returns Parsed device type, browser name, and operating system
 */
function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  // Device detection
  let device = "desktop";
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
  }

  // Browser detection (order matters - check specific before general)
  let browser = "other";
  if (/edg/i.test(ua)) browser = "edge";
  else if (/opr|opera/i.test(ua)) browser = "opera";
  else if (/chrome|chromium|crios/i.test(ua)) browser = "chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "safari";

  // OS detection
  let os = "other";
  if (/windows/i.test(ua)) os = "windows";
  else if (/macintosh|mac os/i.test(ua)) os = "macos";
  else if (/linux/i.test(ua) && !/android/i.test(ua)) os = "linux";
  else if (/android/i.test(ua)) os = "android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "ios";

  return { device, browser, os };
}

// ── Main Function ──────────────────────────────────────────

/**
 * Track a page view in the database.
 * Called from proxy.ts on every request. Silently fails on errors
 * to avoid breaking the application flow.
 *
 * Privacy considerations:
 * - IP addresses are hashed (SHA-256, truncated to 16 chars)
 * - User agent truncated to 500 chars
 * - Referrer truncated to 500 chars
 *
 * @param request - Incoming HTTP request
 */
export async function trackPageView(request: Request): Promise<void> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // Skip tracking for API routes and static assets
    if (IGNORE_PATHS.test(path)) return;

    // Skip bot traffic
    const userAgent = request.headers.get("user-agent") || "";
    if (BOT_PATTERNS.test(userAgent)) return;

    // Extract and hash IP for privacy (GDPR-compliant, no raw IPs stored)
    const ip = request.headers.get("cf-connecting-ip")
      || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // Geo data from Cloudflare headers (if available)
    const country = request.headers.get("cf-ipcountry") || null;
    const city = request.headers.get("cf-ipcity") || null;
    const referrer = request.headers.get("referer") || null;

    // Parse device information
    const { device, browser, os } = parseUserAgent(userAgent);

    // Persist to database
    await db.pageView.create({
      data: {
        path,
        ipHash,
        country,
        city,
        userAgent: userAgent.slice(0, 500),
        device,
        browser,
        os,
        referrer: referrer?.slice(0, 500) || null,
      },
    });
  } catch {
    // Non-blocking — silently fail to avoid affecting user experience
  }
}
