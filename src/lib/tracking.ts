import { createHash } from "crypto";
import { db } from "@/lib/db";

const BOT_PATTERNS = /bot|crawler|spider|googlebot|bingbot|slurp|duckduckbot|baidu|yandex|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot/i;

const IGNORE_PATHS = /^\/(api|_next|images|favicon|robots|sitemap)/;

function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  let device = "desktop";
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
  }

  let browser = "other";
  if (/edg/i.test(ua)) browser = "edge";
  else if (/opr|opera/i.test(ua)) browser = "opera";
  else if (/chrome|chromium|crios/i.test(ua)) browser = "chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "safari";

  let os = "other";
  if (/windows/i.test(ua)) os = "windows";
  else if (/macintosh|mac os/i.test(ua)) os = "macos";
  else if (/linux/i.test(ua) && !/android/i.test(ua)) os = "linux";
  else if (/android/i.test(ua)) os = "android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "ios";

  return { device, browser, os };
}

export async function trackPageView(request: Request): Promise<void> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    if (IGNORE_PATHS.test(path)) return;

    const userAgent = request.headers.get("user-agent") || "";
    if (BOT_PATTERNS.test(userAgent)) return;

    const ip = request.headers.get("cf-connecting-ip")
      || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

    const country = request.headers.get("cf-ipcountry") || null;
    const city = request.headers.get("cf-ipcity") || null;
    const referrer = request.headers.get("referer") || null;
    const { device, browser, os } = parseUserAgent(userAgent);

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
    // Non-blocking — silently fail
  }
}
