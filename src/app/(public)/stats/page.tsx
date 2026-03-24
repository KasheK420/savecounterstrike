import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isModeratorUser } from "@/lib/admin";
import { StatsContent } from "@/components/stats/StatsContent";

export const metadata: Metadata = {
  title: "CS2 Statistics",
  description:
    "Track cheating prevalence, VAC ban waves, Premier leaderboard, and player data in CS2.",
};

export default async function StatsPage() {
  const isMod = await isModeratorUser();
  if (!isMod) {
    redirect("/");
  }

  return <StatsContent />;
}
