import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

const ALLOWED_HOSTS = new Set([
  "pbs.twimg.com",
  "video.twimg.com",
  "abs.twimg.com",
  "img.youtube.com",
  "i.ytimg.com",
]);

export async function GET(request: NextRequest) {
  // Rate limit: 60 proxy requests per minute per IP
  const rl = rateLimitByIp(request, "media-proxy", 60, 60_000);
  if (rl.limited) return rateLimitResponse(rl);

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Strict protocol check
  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only HTTPS URLs allowed" }, { status: 403 });
  }

  // Exact hostname match (prevents subdomain tricks)
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  // Reject credential-based URL bypass (user:pass@host)
  if (parsed.username || parsed.password) {
    return NextResponse.json({ error: "Credentials not allowed" }, { status: 403 });
  }

  try {
    // Fetch using reconstructed URL (not raw user input)
    const safeUrl = parsed.toString();
    const res = await fetch(safeUrl, {
      headers: { "User-Agent": "SaveCounterStrike-Proxy/1.0" },
      redirect: "error",
    });

    if (!res.ok) {
      return new Response(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";

    // Only proxy image/video content
    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      return NextResponse.json({ error: "Only media content allowed" }, { status: 403 });
    }

    // Reject responses larger than 25MB to prevent memory abuse
    const contentLength = res.headers.get("content-length");
    const MAX_SIZE = 25 * 1024 * 1024;
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      return NextResponse.json({ error: "Response too large" }, { status: 413 });
    }

    const body = await res.arrayBuffer();
    if (body.byteLength > MAX_SIZE) {
      return new Response(null, { status: 413 });
    }

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
