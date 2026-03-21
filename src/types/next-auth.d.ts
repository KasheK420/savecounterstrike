import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      steamId?: string;
      role?: string;
      userId?: string;
    };
  }
}
