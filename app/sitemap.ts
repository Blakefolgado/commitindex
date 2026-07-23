import type { MetadataRoute } from "next";
import { companies } from "@/lib/companies";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://open-office.vercel.app";
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/leaderboards`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/compare`, changeFrequency: "weekly", priority: 0.8 },
    ...companies.map((company) => ({
      url: `${base}/company/${company.org}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
