import type { Metadata } from "next";
import { CompareTool } from "@/components/compare-tool";
import { companies } from "@/lib/companies";
import {
  getStoredOrganization,
  leaderboardSnapshot,
} from "@/lib/snapshots";
import type { OrganizationActivity } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compare company GitHub activity — Commit Index",
  description: "Compare public commits, activity consistency, momentum and shipping patterns across technology companies.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{
    orgs?: string;
    org1?: string;
    org2?: string;
    org3?: string;
  }>;
}) {
  const indexedOrgs = new Set(
    leaderboardSnapshot.entries.map((entry) => entry.org),
  );
  const availableCompanies = companies.filter((company) => indexedOrgs.has(company.org));
  const params = await searchParams;
  const formOrgs = [params.org1, params.org2, params.org3].filter(Boolean).join(",");
  const requested = (formOrgs || params.orgs || "vercel,stripe")
    .split(",")
    .map((org) => org.trim().toLowerCase())
    .filter((org, index, all) => /^[a-z0-9-]+$/.test(org) && all.indexOf(org) === index)
    .slice(0, 3);
  const initialOrgs = requested.length
    ? requested
    : availableCompanies.slice(0, 2).map((company) => company.org);
  const items = initialOrgs
    .map((org) => getStoredOrganization(org))
    .filter((item): item is OrganizationActivity => Boolean(item));

  return <CompareTool availableCompanies={availableCompanies} items={items} />;
}
