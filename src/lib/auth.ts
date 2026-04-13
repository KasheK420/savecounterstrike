/**
 * @fileoverview NextAuth v5 configuration with Steam + Email authentication.
 *
 * Handles Steam OpenID and email/password authentication, user creation/updates,
 * role assignment, and session management with security stamp validation.
 *
 * @module auth
 * @see {@link https://authjs.dev/getting-started/installation|NextAuth Docs}
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { timingSafeCompare } from "./timing";

// ── Admin Configuration ─────────────────────────────────────

/** Steam64 IDs from ADMIN_STEAM_IDS env var (comma-separated) */
const adminSteamIds = (process.env.ADMIN_STEAM_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * NextAuth configuration with Steam + Email credentials providers.
 * Exported auth helpers for use in server components and API routes.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ── Steam Provider ────────────────────────────────────
    Credentials({
      id: "steam",
      name: "Steam",
      credentials: {
        steamId: { type: "text" },
        displayName: { type: "text" },
        avatarUrl: { type: "text" },
        profileUrl: { type: "text" },
      },
      async authorize(credentials) {
        const steamId = credentials?.steamId as string;
        if (!steamId) return null;

        const existing = await db.user.findUnique({ where: { steamId } });
        if (existing?.isBanned) return null;

        let role: "ADMIN" | "MODERATOR" | "USER";
        if (adminSteamIds.includes(steamId)) {
          role = "ADMIN";
        } else if (existing?.role === "MODERATOR") {
          role = "MODERATOR";
        } else if (existing?.role === "ADMIN" && !adminSteamIds.includes(steamId)) {
          role = "ADMIN";
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
          authMethod: "steam" as const,
          mfaVerified: !user.mfaEnabled,
          securityStamp: user.securityStamp,
          isEmailVerified: user.emailVerified,
        };
      },
    }),

    // ── Email/Password Provider ───────────────────────────
    Credentials({
      id: "email-password",
      name: "Email",
      credentials: {
        userId: { type: "text" },
        mfaVerified: { type: "text" },
      },
      async authorize(credentials) {
        // This provider is called AFTER password verification in our custom login route.
        // The login route handles password checking, lockout, etc.
        // This provider just creates the session.
        const userId = credentials?.userId as string;
        if (!userId) return null;

        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            steamId: true,
            email: true,
            role: true,
            isBanned: true,
            mfaEnabled: true,
            securityStamp: true,
            emailVerified: true,
          },
        });

        if (!user || user.isBanned) return null;

        return {
          id: user.id,
          name: user.displayName,
          image: user.avatarUrl,
          steamId: user.steamId,
          email: user.email,
          role: user.role,
          authMethod: "email" as const,
          mfaVerified: credentials?.mfaVerified === "true" || !user.mfaEnabled,
          securityStamp: user.securityStamp,
          isEmailVerified: user.emailVerified,
        };
      },
    }),
  ],

  // ── Session Callbacks ─────────────────────────────────────

  callbacks: {
    /**
     * JWT callback — runs when token is created or updated.
     * Adds custom claims and validates security stamp against DB.
     */
    async jwt({ token, user, trigger }) {
      // On sign-in: populate token with user data
      if (user) {
        const u = user as Record<string, unknown>;
        token.steamId = u.steamId as string | undefined;
        token.role = u.role as string | undefined;
        token.userId = u.id as string | undefined;
        token.authMethod = u.authMethod as string | undefined;
        token.mfaVerified = u.mfaVerified as boolean | undefined;
        token.securityStamp = u.securityStamp as string | undefined;
        token.isEmailVerified = u.isEmailVerified as boolean | undefined;
        token.email = u.email as string | undefined;
      }

      // On every request: validate security stamp against DB
      // This catches password changes, role changes, MFA changes
      if (token.userId && trigger !== "signIn") {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          select: { securityStamp: true, role: true, isBanned: true, emailVerified: true },
        });

        // Force re-auth if user deleted, banned, or security stamp changed
        if (!dbUser || dbUser.isBanned) {
          return { ...token, expired: true };
        }
        const dbStamp = dbUser.securityStamp;
        const tokenStamp = token.securityStamp as string | undefined;
        if (
          typeof dbStamp !== "string" ||
          typeof tokenStamp !== "string" ||
          !timingSafeCompare(dbStamp, tokenStamp)
        ) {
          return { ...token, expired: true };
        }
        // Keep role in sync with DB
        token.role = dbUser.role;
        token.isEmailVerified = dbUser.emailVerified;
      }

      return token;
    },

    /**
     * Session callback — makes token claims available in session.
     */
    session({ session, token }) {
      // If token is expired (security stamp mismatch), clear session
      if ((token as Record<string, unknown>).expired) {
        session.user = {} as typeof session.user;
        return session;
      }

      if (session.user) {
        session.user.steamId = token.steamId as string | undefined;
        session.user.role = token.role as string | undefined;
        session.user.userId = token.userId as string | undefined;
        session.user.authMethod = token.authMethod as "email" | "steam" | undefined;
        session.user.mfaVerified = token.mfaVerified as boolean | undefined;
        session.user.isEmailVerified = token.isEmailVerified as boolean | undefined;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },

  // ── Configuration ─────────────────────────────────────

  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
});
