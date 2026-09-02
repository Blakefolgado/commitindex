import { head, put } from "@vercel/blob";
import type { PersonContributionHistory } from "@/lib/types";

const indexPath = "people-index.json";
const maxEntries = 200;

export type PeopleIndexEntry = {
  avatarUrl: string;
  contributions30d: number;
  contributions12m: number;
  contributionsPrior12m: number;
  login: string;
  lookedUpAt: string;
  name: string;
  streak: number;
};

function sumSince(
  contributions: PersonContributionHistory["contributions"],
  start: string,
  end: string,
) {
  return contributions
    .filter((day) => day.date >= start && day.date <= end)
    .reduce((sum, day) => sum + day.count, 0);
}

function dayOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Consecutive active days ending at the latest day, ignoring a still-empty today. */
function currentStreak(contributions: PersonContributionHistory["contributions"]) {
  let streak = 0;
  for (let index = contributions.length - 1; index >= 0; index -= 1) {
    if (contributions[index].count > 0) streak += 1;
    else if (index < contributions.length - 1) break;
  }
  return streak;
}

export function summarizePerson(person: PersonContributionHistory): PeopleIndexEntry {
  const today = new Date().toISOString().slice(0, 10);
  return {
    avatarUrl: person.avatarUrl,
    contributions30d: sumSince(person.contributions, dayOffset(30), today),
    contributions12m: sumSince(person.contributions, dayOffset(365), today),
    contributionsPrior12m: sumSince(person.contributions, dayOffset(730), dayOffset(366)),
    login: person.login,
    lookedUpAt: new Date().toISOString(),
    name: person.name,
    streak: currentStreak(person.contributions),
  };
}

export async function readPeopleIndex(): Promise<PeopleIndexEntry[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const blob = await head(indexPath);
    // 60s is fresh enough for a leaderboard and keeps the two pages on ISR
    // rather than rendering per request.
    const response = await fetch(blob.downloadUrl, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    return (await response.json()) as PeopleIndexEntry[];
  } catch {
    // No index yet, or the store is unreachable — the leaderboard just stays empty.
    return [];
  }
}

/**
 * Upsert one person into the shared index.
 * ponytail: read-modify-write on a single blob, so two lookups landing in the
 * same instant can drop one of them. Move to per-login blobs plus an aggregation
 * pass if lookups ever become concurrent enough for that to matter.
 */
export async function recordPerson(person: PersonContributionHistory) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const entry = summarizePerson(person);
  const existing = await readPeopleIndex();
  const entries = [entry, ...existing.filter((candidate) => candidate.login !== entry.login)]
    .sort((a, b) => b.contributions12m - a.contributions12m)
    .slice(0, maxEntries);

  await put(indexPath, JSON.stringify(entries), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json",
  });
}
