import type { Metadata } from "next";
import { LeaderboardClient } from "@/components/leaderboard-client";
import snapshotData from "@/data/leaderboard.json";
import type { LeaderboardSnapshot } from "@/lib/types";

export const metadata: Metadata = {
  title: "Company GitHub leaderboards — Open Office",
  description: "Rank technology companies by public commits, consistency, momentum, active days and weekend activity.",
};

export default function LeaderboardsPage() {
  return <LeaderboardClient snapshot={snapshotData as LeaderboardSnapshot} />;
}
