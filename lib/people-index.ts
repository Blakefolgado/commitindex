import { list, put } from "@vercel/blob";
import { renderPersonCard } from "@/lib/person-card";
import { buildMonthlySeries, type PersonContributionHistory } from "@/lib/types";

const peoplePrefix = "people/";
const maxEntries = 100;

export type PeopleIndexEntry = {
  avatarUrl: string;
  contributions30d: number;
  contributions12m: number;
  contributionsPrior12m: number;
  /** Public URL of this person's pre-rendered share card, if it saved. */
  cardUrl?: string;
  login: string;
  lookedUpAt: string;
  /** Monthly contribution totals over the same 3-year window as the chart. */
  months: number[];
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
    months: buildMonthlySeries(person.contributions).map((month) => month.total),
    name: person.name,
    streak: currentStreak(person.contributions),
  };
}

export async function readPeopleIndex(): Promise<PeopleIndexEntry[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const { blobs } = await list({ prefix: peoplePrefix });
    const recent = blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, maxEntries);
    const entries = await Promise.all(recent.map(async (blob) => {
      try {
        // Short enough that a profile you just searched shows up on the
        // leaderboard, long enough to keep the page on ISR.
        const response = await fetch(blob.downloadUrl, { next: { revalidate: 10 } });
        return response.ok ? (await response.json()) as PeopleIndexEntry : null;
      } catch {
        return null;
      }
    }));
    return entries
      .filter((entry): entry is PeopleIndexEntry => Boolean(entry?.login))
      .sort((a, b) => b.contributions12m - a.contributions12m);
  } catch {
    // No index yet, or the store is unreachable — the leaderboard stays empty.
    return [];
  }
}

/**
 * Renders the share card once, at search time, and stores it as a plain PNG.
 * Crawlers then fetch a static file from the CDN instead of waiting on a
 * function that has to draw the image while they hold the connection open.
 */
async function storeCard(entry: PeopleIndexEntry) {
  const body = await renderPersonCard(entry);
  const blob = await put(`cards/${entry.login.toLowerCase()}.png`, Buffer.from(body), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 3600,
    contentType: "image/png",
  });
  return blob.url;
}

/**
 * Save one person as their own blob. One file per login means two lookups
 * landing at the same moment cannot overwrite each other, which a single
 * read-modify-write index could and did.
 * ponytail: the leaderboard read fetches every stored person, capped at the 100
 * most recent. Aggregate into one file on write if that list ever gets long.
 */
export async function recordPerson(person: PersonContributionHistory) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const entry = summarizePerson(person);
  // A card that fails to render must not cost us the index entry.
  entry.cardUrl = await storeCard(entry).catch(() => undefined);

  await put(`${peoplePrefix}${entry.login.toLowerCase()}.json`, JSON.stringify(entry), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 10,
    contentType: "application/json",
  });
}
