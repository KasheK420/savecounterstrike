/**
 * @fileoverview NextAuth type augmentation for Steam + Email authentication.
 *
 * Extends the default NextAuth Session interface to include custom fields
 * used throughout the application: identity, role, MFA status.
 *
 * @module types/next-auth
 * @see {@link https://next-auth.js.org/getting-started/typescript|NextAuth TypeScript}
 */

import "next-auth";

declare module "next-auth" {
  /**
   * Extended Session interface with auth fields.
   * Set by the JWT and Session callbacks in auth.ts.
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
      /** Internal database user ID */
      userId?: string;
      /** How the user authenticated in this session */
      authMethod?: "email" | "steam";
      /** Whether MFA was verified in this session */
      mfaVerified?: boolean;
      /** Security stamp for session invalidation */
      securityStamp?: string;
      /** Whether user's email is verified */
      isEmailVerified?: boolean;
    };
  }
}
