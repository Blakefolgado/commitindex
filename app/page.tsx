import { Directory } from "@/components/directory";
import leaderboardSnapshot from "@/data/leaderboard.json";
import { companies } from "@/lib/companies";
import type { LeaderboardSnapshot } from "@/lib/types";

export default function Home() {
  const indexedOrgs = new Set(
    (leaderboardSnapshot as LeaderboardSnapshot).entries.map((entry) => entry.org),
  );

  return (
    <Directory
      initialCompanies={companies.filter((company) => indexedOrgs.has(company.org))}
      snapshot={leaderboardSnapshot as LeaderboardSnapshot}
    />
  );
}
