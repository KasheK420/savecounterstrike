/**
 * @fileoverview CSRF protection utilities for origin validation.
 *
 * Validates that incoming requests originate from the expected site URL,
 * preventing cross-site request forgery attacks on API routes.
 *
 * @module csrf
 */

/**
 * Validates that a request's Origin header matches the configured site URL.
 *
 * @param request - The incoming HTTP request
 * @returns true if the origin matches, false otherwise
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (!origin) return false;
  try {
    return origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}

/**
 * Throws an error if the request's Origin header is invalid.
 *
 * @param request - The incoming HTTP request
 * @throws {Error} If the origin does not match the configured site URL
 */
export function requireValidOrigin(request: Request): void {
  if (!validateOrigin(request)) {
    throw new Error("Invalid origin");
  }
}
