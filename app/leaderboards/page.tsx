import type { Metadata } from "next";
import { LeaderboardClient } from "@/components/leaderboard-client";
import snapshotData from "@/data/leaderboard.json";
import type { LeaderboardSnapshot } from "@/lib/types";

export const metadata: Metadata = {
  title: "Company and people GitHub leaderboards — Commit Index",
  description: "Rank technology companies and public contributors by commits, code changes, consistency and momentum.",
};

export default function LeaderboardsPage() {
  return <LeaderboardClient snapshot={snapshotData as LeaderboardSnapshot} />;
}
