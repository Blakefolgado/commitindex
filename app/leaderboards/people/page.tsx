import type { Metadata } from "next";
import {
  PeopleLeaderboard,
  type PeopleRankMode,
} from "@/components/people-leaderboard";
import { peopleSnapshot } from "@/lib/snapshots";

export const metadata: Metadata = {
  title: "Public GitHub contributor leaderboard — Commit Index",
  description: "Rank public contributors across technology company repositories.",
};

export default async function PeopleLeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    company?: string;
    limit?: string;
    mode?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const mode: PeopleRankMode = (
    params.mode === "additions"
    || params.mode === "deletions"
    || params.mode === "repositories"
  ) ? params.mode : "commits";
  const company = params.company || "All companies";
  const limit = Math.min(Math.max(Number.parseInt(params.limit || "30", 10) || 30, 30), 150);

  return (
    <PeopleLeaderboard
      company={company}
      limit={limit}
      mode={mode}
      query={params.q || ""}
      snapshot={peopleSnapshot}
    />
  );
}
