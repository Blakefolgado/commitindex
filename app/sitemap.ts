import type { MetadataRoute } from "next";
import { organizationsSnapshot } from "@/lib/snapshots";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://commitindex.com";
  // Company pages are statically generated from the organizations snapshot, so the
  // sitemap must follow that list rather than the (larger) company catalogue.
  const lastModified = new Date(organizationsSnapshot.generatedAt);

  return [
    { url: base, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${base}/leaderboards`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/leaderboards/people`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/compare`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/compare/people`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...organizationsSnapshot.entries.map((company) => ({
      url: `${base}/company/${company.org.toLowerCase()}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
