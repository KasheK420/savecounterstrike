// Simple in-memory rate limiter
// Resets on server restart. Good enough for basic abuse prevention.

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now > value.resetAt) store.delete(key);
  }
}, 60_000);

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetIn: number;
}

export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxRequests - 1, resetIn: windowMs };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  return {
    limited: false,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

export function getClientIp(request: Request): string {
  // Cloudflare Tunnel sets the real client IP — most trusted source
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Fall back to rightmost non-private IP in x-forwarded-for
  // (rightmost = added by the closest trusted proxy)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    // Use last IP (added by our reverse proxy, not client-controlled)
    return ips[ips.length - 1] || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitByIp(
  request: Request,
  endpoint: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  const ip = getClientIp(request);
  const key = `${endpoint}:${ip}`;
  return rateLimit(key, maxRequests, windowMs);
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: Math.ceil(result.resetIn / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(result.resetIn / 1000)),
      },
    }
  );
}
