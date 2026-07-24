import type { Metadata } from "next";
import { CompareTool } from "@/components/compare-tool";
import leaderboardSnapshot from "@/data/leaderboard.json";
import { companies } from "@/lib/companies";
import type { LeaderboardSnapshot } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compare company GitHub activity — Commit Index",
  description: "Compare public commits, activity consistency, momentum and shipping patterns across technology companies.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ orgs?: string }>;
}) {
  const indexedOrgs = new Set(
    (leaderboardSnapshot as LeaderboardSnapshot).entries.map((entry) => entry.org),
  );
  const availableCompanies = companies.filter((company) => indexedOrgs.has(company.org));
  const params = await searchParams;
  const requested = (params.orgs || "vercel,stripe")
    .split(",")
    .map((org) => org.trim().toLowerCase())
    .filter((org, index, all) => /^[a-z0-9-]+$/.test(org) && all.indexOf(org) === index)
    .slice(0, 3);
  const initialOrgs = requested.length
    ? requested
    : availableCompanies.slice(0, 2).map((company) => company.org);
  return <CompareTool availableCompanies={availableCompanies} initialOrgs={initialOrgs} />;
}
