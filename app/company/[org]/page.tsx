import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/components/company-detail";
import { getOrganizationActivity, GitHubRequestError } from "@/lib/github";

export const revalidate = 86400;

async function loadOrganization(org: string) {
  try {
    return await getOrganizationActivity(org);
  } catch (error) {
    if (error instanceof GitHubRequestError && (error.status === 400 || error.status === 404)) notFound();
    throw error;
  }
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
  return <CompanyDetail data={data} />;
}
