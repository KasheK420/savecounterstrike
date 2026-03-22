/**
 * @fileoverview NextAuth type augmentation for Steam authentication.
 *
 * Extends the default NextAuth Session interface to include Steam-specific
 * fields (steamId, role, userId) used throughout the application.
 *
 * @module types/next-auth
 * @see {@link https://next-auth.js.org/getting-started/typescript|NextAuth TypeScript}
 */

import "next-auth";

declare module "next-auth" {
  /**
   * Extended Session interface with Steam authentication fields.
   * These properties are set by the JWT and Session callbacks in auth.ts.
   */
  interface Session {
    user: {
      /** Standard NextAuth fields */
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Steam64 ID for Steam-authenticated users */
      steamId?: string;
      /** User role: "USER" | "MODERATOR" | "ADMIN" */
      role?: string;
      /** Internal database user ID (alias of id) */
      userId?: string;
    };
  }
}
