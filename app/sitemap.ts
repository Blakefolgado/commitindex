import type { MetadataRoute } from "next";
import leaderboardSnapshot from "@/data/leaderboard.json";
import type { LeaderboardSnapshot } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://commitindex.com";
  const indexedCompanies = (leaderboardSnapshot as LeaderboardSnapshot).entries;

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/leaderboards`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/compare`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/compare/people`, changeFrequency: "weekly", priority: 0.8 },
    ...indexedCompanies.map((company) => ({
      url: `${base}/company/${company.org}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
