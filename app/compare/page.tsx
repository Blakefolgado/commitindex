import type { Metadata } from "next";
import { CompareTool } from "@/components/compare-tool";
import { companies } from "@/lib/companies";

export const metadata: Metadata = {
  title: "Compare company GitHub activity — Open Office",
  description: "Compare public commits, activity consistency, momentum and shipping patterns across technology companies.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ orgs?: string }>;
}) {
  const params = await searchParams;
  const requested = (params.orgs || "vercel,stripe")
    .split(",")
    .map((org) => org.trim().toLowerCase())
    .filter((org, index, all) => /^[a-z0-9-]+$/.test(org) && all.indexOf(org) === index)
    .slice(0, 3);
  const initialOrgs = requested.length ? requested : companies.slice(0, 2).map((company) => company.org);
  return <CompareTool initialOrgs={initialOrgs} />;
}
