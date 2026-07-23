import { Directory } from "@/components/directory";
import leaderboardSnapshot from "@/data/leaderboard.json";
import { companies } from "@/lib/companies";
import type { LeaderboardSnapshot } from "@/lib/types";

export default function Home() {
  return (
    <Directory
      initialCompanies={companies}
      snapshot={leaderboardSnapshot as LeaderboardSnapshot}
    />
  );
}
