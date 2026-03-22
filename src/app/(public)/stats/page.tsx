import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StatsContent } from "@/components/stats/StatsContent";

export const metadata: Metadata = {
  title: "CS2 Statistics",
  description:
    "Track cheating prevalence, VAC ban waves, Premier leaderboard, and player data in CS2.",
};

export default async function StatsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "MODERATOR") {
    redirect("/");
  }

  return <StatsContent />;
}
