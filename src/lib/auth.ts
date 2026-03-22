/**
 * @fileoverview NextAuth v5 configuration with Steam OpenID authentication.
 *
 * Handles Steam-based authentication, user creation/updates, and role assignment.
 * Supports ADMIN (env-configured), MODERATOR (manually assigned), and USER roles.
 *
 * @module auth
 * @see {@link https://authjs.dev/getting-started/installation|NextAuth Docs}
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";

// ── Admin Configuration ─────────────────────────────────────

/** Steam64 IDs from ADMIN_STEAM_IDS env var (comma-separated) */
const adminSteamIds = (process.env.ADMIN_STEAM_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * NextAuth configuration with Steam credentials provider.
 * Exported auth helpers for use in server components and API routes.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "steam",
      name: "Steam",
      credentials: {
        steamId: { type: "text" },
        displayName: { type: "text" },
        avatarUrl: { type: "text" },
        profileUrl: { type: "text" },
      },
      /**
       * Authorize callback — called after Steam OpenID verification.
       * Creates or updates user record and determines role.
       *
       * @param credentials - Steam profile data from callback
       * @returns User object for JWT or null if banned/invalid
       */
      async authorize(credentials) {
        const steamId = credentials?.steamId as string;
        if (!steamId) return null;

        // Check if user exists in database
        const existing = await db.user.findUnique({ where: { steamId } });

        // Block banned users from signing in
        if (existing?.isBanned) {
          return null;
        }

        // ── Role Determination ───────────────────────────────
        // Priority: 1) Env ADMIN_STEAM_IDS → ADMIN
        //           2) Existing MODERATOR → preserve
        //           3) Existing ADMIN (manual) → preserve
        //           4) Default → USER
        let role: "ADMIN" | "MODERATOR" | "USER";
        if (adminSteamIds.includes(steamId)) {
          role = "ADMIN";
        } else if (existing?.role === "MODERATOR") {
          role = "MODERATOR"; // Preserve manually-assigned MODERATOR
        } else if (existing?.role === "ADMIN" && !adminSteamIds.includes(steamId)) {
          role = "ADMIN"; // Preserve manually-assigned ADMIN (removed from env)
        } else {
          role = existing?.role || "USER";
        }

        const user = await db.user.upsert({
          where: { steamId },
          update: {
            displayName: (credentials.displayName as string) || "Unknown",
            avatarUrl: (credentials.avatarUrl as string) || null,
            profileUrl: (credentials.profileUrl as string) || null,
            role,
          },
          create: {
            steamId,
            displayName: (credentials.displayName as string) || "Unknown",
            avatarUrl: (credentials.avatarUrl as string) || null,
            profileUrl: (credentials.profileUrl as string) || null,
            role,
          },
        });

        return {
          id: user.id,
          name: user.displayName,
          image: user.avatarUrl,
          steamId: user.steamId,
          role: user.role,
        };
      },
    }),
  ],
  // ── Session Callbacks ─────────────────────────────────────

  callbacks: {
    /**
     * JWT callback — runs when token is created or updated.
     * Adds custom claims (steamId, role, userId) to the token.
     */
    jwt({ token, user }) {
      if (user) {
        token.steamId = (user as unknown as { steamId?: string }).steamId;
        token.role = (user as unknown as { role?: string }).role;
        token.userId = user.id;
      }
      return token;
    },
    /**
     * Session callback — makes token claims available in session.
     * These values are accessible client-side via useSession() or auth().
     */
    session({ session, token }) {
      if (session.user) {
        session.user.steamId = token.steamId as string | undefined;
        session.user.role = token.role as string | undefined;
        session.user.userId = token.userId as string | undefined;
      }
      return session;
    },
  },
  // ── Configuration ─────────────────────────────────────────

  pages: {
    /** Redirect unauthenticated users to home page */
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days session lifetime
  },
});
