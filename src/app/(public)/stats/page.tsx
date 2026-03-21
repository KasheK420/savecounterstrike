import type { Metadata } from "next";
import { StatsContent } from "@/components/stats/StatsContent";

export const metadata: Metadata = {
  title: "CS2 Statistics",
  description:
    "Track cheating prevalence, VAC ban waves, Premier leaderboard, and player data in CS2.",
};

export default function StatsPage() {
  return <StatsContent />;
}
