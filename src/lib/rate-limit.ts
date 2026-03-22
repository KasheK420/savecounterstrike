/**
 * @fileoverview In-memory rate limiting utilities.
 *
 * Simple rate limiter using an in-memory Map. State resets on server restart,
 * which is acceptable for basic abuse prevention. Not suitable for distributed
 * deployments (use Redis for multi-server setups).
 *
 * @module rate-limit
 */

// ── Storage ──────────────────────────────────────────────────

/**
 * In-memory store for rate limit tracking.
 * Key format: "{endpoint}:{identifier}" (e.g., "petition:192.168.1.1")
 */
const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup job to prevent memory leaks from stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now > value.resetAt) store.delete(key);
  }
}, 60_000); // Run every minute

/** Result of a rate limit check */
interface RateLimitResult {
  /** Whether the request should be blocked */
  limited: boolean;
  /** Remaining requests allowed in current window */
  remaining: number;
  /** Milliseconds until the rate limit resets */
  resetIn: number;
}

/**
 * Check and update rate limit for a given key.
 *
 * @param key - Unique identifier (e.g., "petition:192.168.1.1")
 * @param maxRequests - Maximum allowed requests in the window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Rate limit status with remaining count and reset time
 */
export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // Initialize new window if no entry exists or window expired
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxRequests - 1, resetIn: windowMs };
  }

  entry.count++;

  // Block if over limit
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

/**
 * Extract client IP from request headers.
 * Prioritizes Cloudflare headers, falls back to X-Forwarded-For.
 *
 * @param request - Incoming request object
 * @returns Client IP address or "unknown"
 */
export function getClientIp(request: Request): string {
  // Cloudflare Tunnel sets the real client IP — most trusted source
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Fall back to rightmost non-private IP in x-forwarded-for
  // (rightmost = added by the closest trusted proxy, not spoofable by client)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    // Use last IP (added by our reverse proxy, not client-controlled)
    return ips[ips.length - 1] || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Convenience wrapper to rate limit by IP address.
 * Automatically extracts IP and constructs the rate limit key.
 *
 * @param request - Incoming request object
 * @param endpoint - Endpoint identifier for namespacing (e.g., "petition")
 * @param maxRequests - Maximum allowed requests in the window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit status
 */
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

/**
 * Generate a standardized 429 Too Many Requests response.
 *
 * @param result - Rate limit result from rateLimit() or rateLimitByIp()
 * @returns Response object with 429 status and retry timing
 */
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
