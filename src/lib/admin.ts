/**
 * @fileoverview Admin and moderator authorization utilities.
 *
 * Provides server-side helpers to check user roles and protect admin/moderator routes.
 * All functions must be called from server components or API routes only.
 *
 * @module admin
 */

import { auth } from "./auth";
import { db } from "./db";
import type { Session } from "next-auth";

/**
 * Require ADMIN role. Returns session if user is admin, null otherwise.
 *
 * @returns Session object if authenticated as ADMIN, null otherwise
 */
export async function requireAdmin(): Promise<Session | null> {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!session?.user || !userId) return null;

  // Re-validate against DB to catch stale JWT claims (role changes, bans)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || user.role !== "ADMIN") return null;

  return session;
}

/**
 * Require MODERATOR or ADMIN role. Returns session if user has elevated permissions.
 *
 * @returns Session object if authenticated as ADMIN or MODERATOR, null otherwise
 */
export async function requireModerator(): Promise<Session | null> {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!session?.user || !userId) return null;

  // Re-validate against DB to catch stale JWT claims (role changes, bans)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;

  return session;
}

/**
 * Lightweight DB-backed admin check for read paths.
 * Returns true if the current session user is a verified admin (not banned).
 */
export async function isAdminUser(): Promise<boolean> {
  const session = await requireAdmin();
  return session !== null;
}

/**
 * Lightweight DB-backed moderator+ check for read paths.
 * Returns true if the current session user is a verified moderator or admin.
 */
export async function isModeratorUser(): Promise<boolean> {
  const session = await requireModerator();
  return session !== null;
}

/**
 * Check that authenticated user is not banned. For use on mutation routes.
 * Returns session if active, null if banned or unauthenticated.
 */
export async function requireActiveUser(): Promise<Session | null> {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!session?.user || !userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isBanned: true },
  });
  if (!user || user.isBanned) return null;

  return session;
}

/**
 * API route helper for authenticated + non-banned users.
 * Returns standardized error response if not active.
 */
export async function requireActiveUserApi() {
  const session = await requireActiveUser();
  if (!session) {
    return {
      error: true as const,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { error: false as const, session };
}

/**
 * Extract role from session. Safe to call with null session.
 *
 * @param session - NextAuth session or null
 * @returns Role string (USER, MODERATOR, ADMIN) or "USER" as default
 */
export function getRole(session: Session | null): string {
  return session?.user?.role || "USER";
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
/**
 * API route helper for bot-to-web service calls.
 * Validates the shared secret in Authorization header.
 *
 * @returns Object with error flag and response (if error)
 */
export function requireBotApi(request: Request) {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) {
    return {
      error: true as const,
      response: new Response(
        JSON.stringify({ error: "Server misconfigured — BOT_API_SECRET not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return {
      error: true as const,
      response: new Response(
        JSON.stringify({ error: "Unauthorized — invalid bot API secret" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { error: false as const };
}

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
