import "server-only";

import { calculateOrganizationStats } from "@/lib/analytics";
import type {
  ActivityDay,
  CodeFrequencyWeek,
  ContributorSummary,
  ContributorWeek,
  ContributorsPayload,
  OrganizationActivity,
  RepoSummary,
} from "@/lib/types";

const API_VERSION = "2022-11-28";
const SAMPLE_SIZE = 8;

type GitHubOrg = {
  login: string;
  name: string | null;
  description: string | null;
  avatar_url: string;
  html_url: string;
  blog: string | null;
  public_repos: number;
  followers: number;
};

type GitHubRepo = {
  name: string;
  html_url: string;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  stargazers_count: number;
  pushed_at: string | null;
  language: string | null;
};

type CommitWeek = {
  week: number;
  total: number;
  days: number[];
};

type CodeFrequencyTuple = [number, number, number];

type GitHubContributor = {
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
    type: "Bot" | "User";
  } | null;
  total: number;
  weeks: {
    w: number;
    a: number;
    d: number;
    c: number;
  }[];
};

export class GitHubRequestError extends Error {
  status: number;

  constructor(status: number) {
    super(`GitHub returned ${status}`);
    this.status = status;
  }
}

export function isValidOrg(org: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(org);
}

async function githubFetch<T>(
  path: string,
  allowProcessing = false,
  cacheResult = true,
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const request = () => fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": "open-office-directory",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(cacheResult ? { next: { revalidate: 86400 } } : { cache: "no-store" as const }),
  });

  let response = await request();
  for (let attempt = 1; allowProcessing && response.status === 202 && attempt <= 2; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 900 * attempt));
    response = await request();
  }
  if (!response.ok) throw new GitHubRequestError(response.status);
  return response.json() as Promise<T>;
}

async function getOrganization(org: string) {
  const [profile, repositories] = await Promise.all([
    githubFetch<GitHubOrg>(`/orgs/${encodeURIComponent(org)}`),
    githubFetch<GitHubRepo[]>(
      `/orgs/${encodeURIComponent(org)}/repos?type=public&sort=pushed&direction=desc&per_page=50`,
    ),
  ]);
  const sampled = repositories
    .filter((repo) => !repo.fork && !repo.archived && !repo.disabled && repo.pushed_at)
    .slice(0, SAMPLE_SIZE);
  return { profile, sampled };
}

async function getCommitActivity(org: string, repo: GitHubRepo) {
  try {
    const weeks = await githubFetch<CommitWeek[] | Record<string, never>>(
      `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo.name)}/stats/commit_activity`,
      true,
    );
    return Array.isArray(weeks) ? weeks : [];
  } catch {
    return [];
  }
}

async function getCodeFrequency(org: string, repo: GitHubRepo) {
  try {
    const weeks = await githubFetch<CodeFrequencyTuple[] | Record<string, never>>(
      `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo.name)}/stats/code_frequency?source=lines-v1`,
      true,
    );
    return { loaded: true, weeks: Array.isArray(weeks) ? weeks : [] };
  } catch {
    return { loaded: false, weeks: [] };
  }
}

function aggregateActivity(results: { repo: GitHubRepo; weeks: CommitWeek[] }[]) {
  const daily = new Map<string, number>();
  const repoSummaries: RepoSummary[] = [];

  for (const { repo, weeks } of results) {
    let repoCommits = 0;
    for (const week of weeks) {
      week.days.forEach((count, dayIndex) => {
        const date = new Date((week.week + dayIndex * 86400) * 1000).toISOString().slice(0, 10);
        daily.set(date, (daily.get(date) ?? 0) + count);
        repoCommits += count;
      });
    }
    repoSummaries.push({
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      commits: repoCommits,
      language: repo.language,
      pushedAt: repo.pushed_at,
    });
  }

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 370);
  const activity: ActivityDay[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    activity.push({ date, count: daily.get(date) ?? 0 });
  }
  return {
    activity,
    repoSummaries: repoSummaries.sort((a, b) => b.commits - a.commits),
  };
}

function aggregateCodeFrequency(
  results: { codeFrequency: { loaded: boolean; weeks: CodeFrequencyTuple[] } }[],
) {
  const weekly = new Map<number, CodeFrequencyWeek>();
  const codeFrequencyRepos = results.filter((result) => result.codeFrequency.loaded).length;
  const cutoff = Math.floor((Date.now() - 370 * 86400 * 1000) / 1000);

  for (const { codeFrequency } of results) {
    for (const [week, additions, deletions] of codeFrequency.weeks) {
      if (week < cutoff) continue;
      const existing = weekly.get(week) ?? { week, additions: 0, deletions: 0 };
      existing.additions += Math.max(0, additions);
      existing.deletions += Math.abs(deletions);
      weekly.set(week, existing);
    }
  }

  const weeks = [...weekly.values()].sort((left, right) => left.week - right.week);
  const totalAdditions = weeks.reduce((sum, week) => sum + week.additions, 0);
  const totalDeletions = weeks.reduce((sum, week) => sum + week.deletions, 0);
  return {
    codeFrequency: weeks,
    codeFrequencyRepos,
    totalAdditions,
    totalDeletions,
    totalLinesChanged: totalAdditions + totalDeletions,
  };
}

export async function getOrganizationActivity(rawOrg: string): Promise<OrganizationActivity> {
  const org = rawOrg.trim().toLowerCase();
  if (!isValidOrg(org)) throw new GitHubRequestError(400);
  const { profile, sampled } = await getOrganization(org);
  const results = await Promise.all(sampled.map(async (repo) => {
    const [weeks, codeFrequency] = await Promise.all([
      getCommitActivity(org, repo),
      getCodeFrequency(org, repo),
    ]);
    return { repo, weeks, codeFrequency };
  }));
  const { activity, repoSummaries } = aggregateActivity(results);
  const {
    codeFrequency,
    codeFrequencyRepos,
    totalAdditions,
    totalDeletions,
    totalLinesChanged,
  } = aggregateCodeFrequency(results);
  const totalCommits = activity.reduce((sum, day) => sum + day.count, 0);
  return {
    org: profile.login,
    name: profile.name || profile.login,
    description: profile.description,
    avatarUrl: profile.avatar_url,
    githubUrl: profile.html_url,
    websiteUrl: profile.blog || null,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    activity,
    codeFrequency,
    codeFrequencyRepos,
    sampledRepos: repoSummaries,
    totalCommits,
    totalAdditions,
    totalDeletions,
    totalLinesChanged,
    activeDays: activity.filter((day) => day.count > 0).length,
    stats: calculateOrganizationStats(activity),
    coverage: `${repoSummaries.length} most recently active public repositories`,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getOrganizationContributors(rawOrg: string): Promise<ContributorsPayload> {
  const org = rawOrg.trim().toLowerCase();
  if (!isValidOrg(org)) throw new GitHubRequestError(400);
  const { sampled } = await getOrganization(org);
  const responses = await Promise.all(sampled.map(async (repo) => {
    try {
      const contributors = await githubFetch<GitHubContributor[] | Record<string, never>>(
        `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo.name)}/stats/contributors`,
        true,
        false,
      );
      return { repo, contributors: Array.isArray(contributors) ? contributors : [], loaded: true };
    } catch {
      return { repo, contributors: [], loaded: false };
    }
  }));
  if (sampled.length > 0 && responses.every((response) => !response.loaded)) {
    throw new GitHubRequestError(502);
  }

  const people = new Map<string, ContributorSummary>();
  const personWeeks = new Map<string, Map<number, ContributorWeek>>();
  for (const { contributors } of responses) {
    for (const contributor of contributors) {
      if (!contributor.author) continue;
      const login = contributor.author.login;
      if (
        contributor.author.type === "Bot"
        || /(\[bot\]|-bot$|bot$|-robot$|robot$|machine$|-service$)/i.test(login)
        || /^(actions-user|github-actions|bors|modular-magician|mozilla-pontoon|dependabot|renovate)$/i.test(login)
      ) continue;
      const existing = people.get(login) ?? {
        login,
        avatarUrl: contributor.author.avatar_url,
        githubUrl: contributor.author.html_url,
        commits: 0,
        repositories: 0,
        additions: 0,
        deletions: 0,
        weeks: [],
      };
      const weekly = personWeeks.get(login) ?? new Map<number, ContributorWeek>();
      existing.commits += contributor.total;
      existing.repositories += 1;
      for (const week of contributor.weeks) {
        existing.additions += week.a;
        existing.deletions += Math.abs(week.d);
        const current = weekly.get(week.w) ?? {
          week: week.w,
          commits: 0,
          additions: 0,
          deletions: 0,
        };
        current.commits += week.c;
        current.additions += week.a;
        current.deletions += Math.abs(week.d);
        weekly.set(week.w, current);
      }
      people.set(login, existing);
      personWeeks.set(login, weekly);
    }
  }

  return {
    org,
    sampledRepositories: sampled.length,
    contributors: [...people.values()]
      .map((person) => ({
        ...person,
        weeks: [...(personWeeks.get(person.login)?.values() ?? [])]
          .sort((left, right) => left.week - right.week),
      }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 30),
    fetchedAt: new Date().toISOString(),
  };
}
