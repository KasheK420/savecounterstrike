import { auth } from "./auth";

export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user || role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function requireAdminApi() {
  const session = await requireAdmin();
  if (!session) {
    return { error: true as const, response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { "Content-Type": "application/json" } }) };
  }
  return { error: false as const, session };
}
