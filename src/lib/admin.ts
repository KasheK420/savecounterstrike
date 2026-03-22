/**
 * @fileoverview Admin and moderator authorization utilities.
 *
 * Provides server-side helpers to check user roles and protect admin/moderator routes.
 * All functions must be called from server components or API routes only.
 *
 * @module admin
 */

import { auth } from "./auth";
import type { Session } from "next-auth";

/**
 * Require ADMIN role. Returns session if user is admin, null otherwise.
 *
 * @returns Session object if authenticated as ADMIN, null otherwise
 */
export async function requireAdmin(): Promise<Session | null> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") return null;
  return session;
}

/**
 * Require MODERATOR or ADMIN role. Returns session if user has elevated permissions.
 *
 * @returns Session object if authenticated as ADMIN or MODERATOR, null otherwise
 */
export async function requireModerator(): Promise<Session | null> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "MODERATOR")) return null;
  return session;
}

/**
 * Extract role from session. Safe to call with null session.
 *
 * @param session - NextAuth session or null
 * @returns Role string (USER, MODERATOR, ADMIN) or "USER" as default
 */
export function getRole(session: Session | null): string {
  return (session?.user as any)?.role || "USER";
}

/**
 * API route helper for admin-only endpoints.
 * Returns a standardized error response if not admin.
 *
 * @returns Object with error flag, response (if error), and session (if success)
 */
export async function requireAdminApi() {
  const session = await requireAdmin();
  if (!session) {
    return {
      error: true as const,
      response: new Response(
        JSON.stringify({ error: "Unauthorized — admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { error: false as const, session };
}

/**
 * API route helper for moderator+ endpoints.
 * Returns a standardized error response if not moderator or admin.
 *
 * @returns Object with error flag, response (if error), and session (if success)
 */
export async function requireModeratorApi() {
  const session = await requireModerator();
  if (!session) {
    return {
      error: true as const,
      response: new Response(
        JSON.stringify({ error: "Unauthorized — moderator access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { error: false as const, session };
}
