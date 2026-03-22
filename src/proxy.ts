/**
 * @fileoverview Next.js 16 proxy configuration (replaces middleware.ts).
 *
 * Handles request-level processing: analytics tracking, URL redirects,
 * and security headers. Runs on all matched routes before page rendering.
 *
 * @module proxy
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/proxy|Next.js Proxy Docs}
 */

import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/tracking";

/**
 * Proxy handler function — runs on every matched request.
 *
 * Responsibilities:
 * 1. Track page views for analytics (non-blocking)
 * 2. Redirect legacy URLs (/videos → /media)
 * 3. Apply security headers to all responses
 *
 * @param request - Incoming Next.js request
 * @returns NextResponse (redirect, modified, or pass-through)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Analytics Tracking ──────────────────────────────────────
  // Track page view for analytics (fire-and-forget, errors ignored)
  trackPageView(request).catch(() => {});

  // ── URL Redirects ───────────────────────────────────────────
  // Redirect old /videos paths to new /media location
  if (pathname === "/videos" || pathname.startsWith("/videos/")) {
    const newPath = pathname.replace("/videos", "/media");
    return NextResponse.redirect(new URL(newPath, request.url), 301);
  }

  // ── Admin Route Note ──────────────────────────────────────
  // Admin route protection is handled in the admin layout via
  // server-side session checks. Proxy only handles request-level concerns.

  // ── Security Headers ───────────────────────────────────────
  // Apply security headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY"); // Prevent clickjacking
  response.headers.set("X-Content-Type-Options", "nosniff"); // Prevent MIME sniffing
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin"); // Limit referrer leakage

  return response;
}

/**
 * Proxy route matcher configuration.
 * Excludes API routes, static files, and images from proxy processing.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
