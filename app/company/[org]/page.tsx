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
  const url = `https://commitindex.com/company/${data.org.toLowerCase()}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        name: `${data.name} public GitHub commit activity`,
        description: `Daily public, non-merge commit counts for ${data.name} across ${data.sampledRepos.length} sampled public repositories over the last 12 months, totalling ${data.totalCommits.toLocaleString()} commits on ${data.activeDays.toLocaleString()} active days.`,
        url,
        creator: { "@id": "https://commitindex.com/#organization" },
        about: { "@type": "Organization", name: data.name, url: `https://github.com/${data.org}` },
        isAccessibleForFree: true,
        measurementTechnique: "GitHub repository commit statistics API",
        dateModified: data.fetchedAt,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Directory", item: "https://commitindex.com" },
          { "@type": "ListItem", position: 2, name: data.name, item: url },
        ],
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CompanyDetail contributors={contributors} data={data} />
    </>
  );
}
