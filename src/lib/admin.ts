import { auth } from "./auth";
import type { Session } from "next-auth";

export async function requireAdmin(): Promise<Session | null> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") return null;
  return session;
}

export async function requireModerator(): Promise<Session | null> {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "MODERATOR")) return null;
  return session;
}

export function getRole(session: Session | null): string {
  return (session?.user as any)?.role || "USER";
}

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
