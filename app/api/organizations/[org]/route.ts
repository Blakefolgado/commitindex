import { NextRequest, NextResponse } from "next/server";
import type { ActivityDay, OrganizationActivity, RepoSummary } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

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
};

type CommitWeek = {
  week: number;
  total: number;
  days: number[];
};

async function githubFetch<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": "open-office-directory",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    const error = new Error(`GitHub returned ${response.status}`);
    Object.assign(error, { status: response.status });
    throw error;
  }

  return response.json() as Promise<T>;
}

async function getCommitActivity(org: string, repo: GitHubRepo) {
  try {
    const weeks = await githubFetch<CommitWeek[] | Record<string, never>>(
      `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo.name)}/stats/commit_activity`,
    );
    return Array.isArray(weeks) ? weeks : [];
  } catch {
    return [];
  }
}

function aggregateActivity(results: { repo: GitHubRepo; weeks: CommitWeek[] }[]) {
  const daily = new Map<string, number>();
  const repoSummaries: RepoSummary[] = [];

  for (const { repo, weeks } of results) {
    let repoCommits = 0;
    for (const week of weeks) {
      week.days.forEach((count, dayIndex) => {
        const date = new Date((week.week + dayIndex * 86400) * 1000)
          .toISOString()
          .slice(0, 10);
        daily.set(date, (daily.get(date) ?? 0) + count);
        repoCommits += count;
      });
    }
    repoSummaries.push({
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      commits: repoCommits,
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ org: string }> },
) {
  const { org: rawOrg } = await context.params;
  const org = rawOrg.trim().toLowerCase();

  if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(org)) {
    return NextResponse.json({ error: "Invalid GitHub organisation name" }, { status: 400 });
  }

  try {
    const [profile, repositories] = await Promise.all([
      githubFetch<GitHubOrg>(`/orgs/${encodeURIComponent(org)}`),
      githubFetch<GitHubRepo[]>(
        `/orgs/${encodeURIComponent(org)}/repos?type=public&sort=pushed&direction=desc&per_page=50`,
      ),
    ]);

    const sampled = repositories
      .filter((repo) => !repo.fork && !repo.archived && !repo.disabled && repo.pushed_at)
      .slice(0, SAMPLE_SIZE);

    const stats = await Promise.all(
      sampled.map(async (repo) => ({
        repo,
        weeks: await getCommitActivity(org, repo),
      })),
    );
    const { activity, repoSummaries } = aggregateActivity(stats);
    const totalCommits = activity.reduce((sum, day) => sum + day.count, 0);

    const payload: OrganizationActivity = {
      org: profile.login,
      name: profile.name || profile.login,
      description: profile.description,
      avatarUrl: profile.avatar_url,
      githubUrl: profile.html_url,
      websiteUrl: profile.blog || null,
      publicRepos: profile.public_repos,
      followers: profile.followers,
      activity,
      sampledRepos: repoSummaries,
      totalCommits,
      activeDays: activity.filter((day) => day.count > 0).length,
      coverage: `${repoSummaries.length} most recently active public repositories`,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number(error.status)
      : 500;
    const safeStatus = status === 404 ? 404 : status === 403 || status === 429 ? 429 : 500;
    const message = safeStatus === 404
      ? "GitHub organisation not found"
      : safeStatus === 429
        ? "GitHub rate limit reached. Try again shortly."
        : "Could not load this organisation";
    return NextResponse.json({ error: message }, { status: safeStatus });
  }
}
