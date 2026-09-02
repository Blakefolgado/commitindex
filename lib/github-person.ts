import "server-only";

import type {
  PersonContributionDay,
  PersonContributionHistory,
  PersonContributionYear,
} from "@/lib/types";

const GITHUB_API_VERSION = "2022-11-28";
const FIRST_GITHUB_YEAR = 2008;

type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  created_at: string | null;
};

export class GitHubPersonError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function normalizeGitHubUsername(value: string) {
  const trimmed = value.trim().replace(/^@/, "");
  let username = trimmed;

  try {
    const url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
    if (url.hostname.toLowerCase() === "github.com") {
      username = url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
  } catch {
    username = trimmed;
  }

  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) {
    throw new GitHubPersonError(400, "Enter a valid GitHub username or profile URL");
  }
  return username;
}

export function normalizeContributionYear(value: number) {
  const currentYear = new Date().getUTCFullYear();
  if (!Number.isInteger(value) || value < FIRST_GITHUB_YEAR || value > currentYear) {
    throw new GitHubPersonError(400, `Choose a year from ${FIRST_GITHUB_YEAR} to ${currentYear}`);
  }
  return value;
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "";
}

function decodeHtmlText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, key: string) {
  const tag = (html.match(/<meta\b[^>]*>/g) ?? []).find((candidate) => (
    attribute(candidate, "property") === key || attribute(candidate, "name") === key
  ));
  return tag ? decodeHtmlText(attribute(tag, "content")) : "";
}

export function parseGitHubProfileHtml(html: string, username: string): GitHubProfile {
  const login = metaContent(html, "profile:username");
  const avatarUrl = metaContent(html, "og:image");
  const nameMarkup = html.match(
    /<span\b(?=[^>]*\bclass="[^"]*\bp-name\b[^"]*")[^>]*>([\s\S]*?)<\/span>/,
  )?.[1] ?? "";

  if (!login || login.toLowerCase() !== username.toLowerCase() || !avatarUrl) {
    throw new GitHubPersonError(502, "GitHub profile is temporarily unavailable");
  }

  return {
    login,
    name: decodeHtmlText(nameMarkup) || null,
    avatar_url: avatarUrl,
    html_url: `https://github.com/${encodeURIComponent(login)}`,
    created_at: null,
  };
}

export function parseContributionCalendar(html: string) {
  const dayByElementId = new Map<string, PersonContributionDay>();
  const dayTags = html.match(
    /<td\b(?=[^>]*\bclass="[^"]*\bContributionCalendar-day\b[^"]*")[^>]*><\/td>/g,
  ) ?? [];

  for (const tag of dayTags) {
    const date = attribute(tag, "data-date");
    const id = attribute(tag, "id");
    const level = Number.parseInt(attribute(tag, "data-level"), 10);
    if (date && id) {
      dayByElementId.set(id, {
        date,
        count: 0,
        level: Number.isFinite(level) ? Math.min(Math.max(level, 0), 4) : 0,
      });
    }
  }

  for (const match of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const day = dayByElementId.get(match[1]);
    if (!day) continue;
    const count = match[2].match(/([\d,]+) contributions? on/i)?.[1];
    day.count = count ? Number.parseInt(count.replaceAll(",", ""), 10) : 0;
  }

  const contributions = [...dayByElementId.values()].sort((left, right) => (
    left.date.localeCompare(right.date)
  ));
  const headingTotal = html.match(/([\d,]+)\s+contributions?\s+in\s+\d{4}/i)?.[1];
  const totalContributions = headingTotal
    ? Number.parseInt(headingTotal.replaceAll(",", ""), 10)
    : contributions.reduce((sum, day) => sum + day.count, 0);

  if (!contributions.length) {
    throw new GitHubPersonError(502, "GitHub did not return a contribution calendar");
  }
  return { contributions, totalContributions };
}

async function getGitHubProfilePage(username: string) {
  const response = await fetch(`https://github.com/${encodeURIComponent(username)}`, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 (compatible; CommitIndex/1.0; +https://commitindex.com)",
    },
    ...cacheFor(86_400, username),
  });
  if (!response.ok) {
    throw new GitHubPersonError(response.status, response.status === 404
      ? "GitHub user not found"
      : "GitHub profile is temporarily unavailable");
  }
  return parseGitHubProfileHtml(await response.text(), username);
}

/** Cache tag for everything fetched about one person, so a refresh can drop it. */
export function personCacheTag(username: string) {
  return `github-person:${username.toLowerCase()}`;
}

function cacheFor(seconds: number, username: string) {
  return { next: { revalidate: seconds, tags: [personCacheTag(username)] } };
}

async function getGitHubProfile(username: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return getGitHubProfilePage(username);
  }

  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "commit-index-people",
      Authorization: `Bearer ${token}`,
    },
    ...cacheFor(86_400, username),
  });
  if (response.ok) {
    return response.json() as Promise<GitHubProfile>;
  }
  if (response.status === 404) {
    throw new GitHubPersonError(404, "GitHub user not found");
  }
  return getGitHubProfilePage(username);
}

async function getContributionCalendar(username: string, year: number) {
  const response = await fetch(
    `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${year}-01-01&to=${year}-12-31`,
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "commit-index-people",
      },
      ...cacheFor(year === new Date().getUTCFullYear() ? 3_600 : 2_592_000, username),
    },
  );
  if (!response.ok) {
    throw new GitHubPersonError(response.status, "GitHub contributions are temporarily unavailable");
  }
  return parseContributionCalendar(await response.text());
}

export async function getPersonContributionYear(
  rawUsername: string,
  rawYear: number,
): Promise<PersonContributionYear> {
  const username = normalizeGitHubUsername(rawUsername);
  const year = normalizeContributionYear(rawYear);
  const [profile, calendar] = await Promise.all([
    getGitHubProfile(username),
    getContributionCalendar(username, year),
  ]);
  const activeDays = calendar.contributions.filter((day) => day.count > 0).length;

  return {
    login: profile.login,
    name: profile.name || profile.login,
    avatarUrl: profile.avatar_url,
    githubUrl: profile.html_url,
    year,
    totalContributions: calendar.totalContributions,
    activeDays,
    averageActiveDay: activeDays
      ? Number((calendar.totalContributions / activeDays).toFixed(1))
      : 0,
    contributions: calendar.contributions,
    fetchedAt: new Date().toISOString(),
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  ));
  return results;
}

export async function getPersonContributionHistory(
  rawUsername: string,
): Promise<PersonContributionHistory> {
  const username = normalizeGitHubUsername(rawUsername);
  const profile = await getGitHubProfile(username);
  const currentYear = new Date().getUTCFullYear();
  const firstYear = Math.max(
    FIRST_GITHUB_YEAR,
    profile.created_at ? new Date(profile.created_at).getUTCFullYear() : FIRST_GITHUB_YEAR,
  );
  const years = Array.from(
    { length: currentYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
  const calendars = await mapWithConcurrency(
    years,
    4,
    (year) => getContributionCalendar(username, year),
  );
  const firstActiveCalendar = calendars.findIndex((calendar) => calendar.totalContributions > 0);
  const firstVisibleCalendar = firstActiveCalendar >= 0 ? firstActiveCalendar : calendars.length - 1;
  const visibleCalendars = calendars.slice(firstVisibleCalendar);
  const visibleFirstYear = years[firstVisibleCalendar];
  const today = new Date().toISOString().slice(0, 10);
  const contributions = visibleCalendars
    .flatMap((calendar) => calendar.contributions)
    .filter((day) => day.date <= today);
  const totalContributions = visibleCalendars.reduce(
    (sum, calendar) => sum + calendar.totalContributions,
    0,
  );
  const activeDays = contributions.filter((day) => day.count > 0).length;

  return {
    login: profile.login,
    name: profile.name || profile.login,
    avatarUrl: profile.avatar_url,
    githubUrl: profile.html_url,
    createdAt: profile.created_at ?? `${visibleFirstYear}-01-01T00:00:00Z`,
    firstYear: visibleFirstYear,
    lastYear: currentYear,
    totalContributions,
    activeDays,
    averageActiveDay: activeDays
      ? Number((totalContributions / activeDays).toFixed(1))
      : 0,
    contributions,
    fetchedAt: new Date().toISOString(),
  };
}
