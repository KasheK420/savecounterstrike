import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";

const adminSteamIds = (process.env.ADMIN_STEAM_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

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
      async authorize(credentials) {
        const steamId = credentials?.steamId as string;
        if (!steamId) return null;

        // Check if user exists first
        const existing = await db.user.findUnique({ where: { steamId } });

        // Block banned users
        if (existing?.isBanned) {
          return null;
        }

        // Determine role:
        // - Env ADMIN_STEAM_IDS always get ADMIN
        // - Existing users keep their manually-set role (MODERATOR, etc.)
        // - New users default to USER
        let role: "ADMIN" | "MODERATOR" | "USER";
        if (adminSteamIds.includes(steamId)) {
          role = "ADMIN";
        } else if (existing?.role === "MODERATOR") {
          role = "MODERATOR"; // Preserve manually-assigned MODERATOR
        } else if (existing?.role === "ADMIN" && !adminSteamIds.includes(steamId)) {
          role = "ADMIN"; // Preserve manually-assigned ADMIN
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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.steamId = (user as any).steamId;
        token.role = (user as any).role;
        token.userId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).steamId = token.steamId;
        (session.user as any).role = token.role;
        (session.user as any).userId = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
});
