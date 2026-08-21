import type { Metadata } from "next";

import { Directory } from "@/components/directory";
import leaderboardSnapshot from "@/data/leaderboard.json";
import { companies } from "@/lib/companies";
import type { DirectoryEntry, LeaderboardSnapshot } from "@/lib/types";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const snapshot = leaderboardSnapshot as LeaderboardSnapshot;

function sumCommits(days: LeaderboardSnapshot["entries"][number]["activity"]) {
  return days.reduce((sum, day) => sum + day.count, 0);
}

const directoryEntries: DirectoryEntry[] = snapshot.entries.map((entry) => {
  const days6m = entry.activity.slice(-183);
  const days12w = entry.activity.slice(-84);

  return {
    org: entry.org,
    avatarUrl: entry.avatarUrl,
    commits30d: entry.totalCommits ? sumCommits(entry.activity.slice(-30)) : 0,
    commits6m: entry.totalCommits ? sumCommits(days6m) : 0,
    commits12m: entry.totalCommits,
    weeklyCommits: Array.from({ length: 12 }, (_, week) =>
      sumCommits(days12w.slice(week * 7, week * 7 + 7)),
    ),
  };
});

const indexedOrgs = new Set(directoryEntries.map((entry) => entry.org));

export default function Home() {
  return (
    <Directory
      entries={directoryEntries}
      initialCompanies={companies.filter((company) => indexedOrgs.has(company.org))}
    />
  );
}
