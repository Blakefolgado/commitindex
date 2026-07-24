import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/components/company-detail";
import {
  getStoredContributors,
  getStoredOrganization,
  organizationsSnapshot,
} from "@/lib/snapshots";

export const dynamicParams = false;

function loadOrganization(org: string) {
  const organization = getStoredOrganization(org);
  if (!organization) notFound();
  return organization;
}

export function generateStaticParams() {
  return organizationsSnapshot.entries.map(({ org }) => ({ org }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org: string }>;
}): Promise<Metadata> {
  const { org } = await params;
  const data = await loadOrganization(org);
  const title = `${data.name} GitHub activity, top shippers and stats`;
  const description = `${data.name} made ${data.totalCommits.toLocaleString()} public commits across ${data.sampledRepos.length} sampled repositories in the last 12 months.`;
  return {
    title: `${title} — Commit Index`,
    description,
    alternates: { canonical: `/company/${data.org.toLowerCase()}` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const data = await loadOrganization(org);
  const contributors = getStoredContributors(org);
  return <CompanyDetail contributors={contributors} data={data} />;
}
