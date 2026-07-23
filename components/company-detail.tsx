"use client";

import { ArrowUpRight, GitCompareArrows, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCompactNumber, formatMomentum } from "@/lib/analytics";
import { ContributionGrid, type Period } from "@/components/contribution-grid";
import { ShareButton } from "@/components/share-button";
import type { ContributorsPayload, OrganizationActivity } from "@/lib/types";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatRelativeDate(value: string | null) {
  if (!value) return "Unknown";
  const days = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function CompanyDetail({ data }: { data: OrganizationActivity }) {
  const [period, setPeriod] = useState<Period>("rolling");
  const [contributors, setContributors] = useState<ContributorsPayload | null>(null);
  const [contributorError, setContributorError] = useState("");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/organizations/${encodeURIComponent(data.org)}/contributors`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load contributors");
        return payload as ContributorsPayload;
      })
      .then(setContributors)
      .catch((error) => {
        if (error.name !== "AbortError") setContributorError(error.message);
      });
    return () => controller.abort();
  }, [data.org]);

  const topContributors = contributors?.contributors.slice(0, 7) ?? [];
  const maxContributorCommits = topContributors[0]?.commits || 1;

  return (
    <main className="detail-shell">
      <section className="company-hero">
        {/* GitHub avatar URLs are public organisation assets. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="company-avatar-large" src={data.avatarUrl} alt="" width={132} height={132} />
        <div className="company-heading">
          <h1>{data.name}</h1>
          <p>@{data.org}</p>
          <div className="company-links">
            {data.websiteUrl && (
              <a href={data.websiteUrl} target="_blank" rel="noreferrer">
                {data.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ArrowUpRight aria-hidden="true" size={13} />
              </a>
            )}
            <a href={data.githubUrl} target="_blank" rel="noreferrer">
              github.com/{data.org}
              <ArrowUpRight aria-hidden="true" size={13} />
            </a>
          </div>
        </div>
        <div className="company-hero-actions">
          <ShareButton title={`${data.name} public GitHub activity`} />
          <span>{data.sampledRepos.length} active public repos sampled · updated daily</span>
        </div>
      </section>

      <section className="headline-stats" aria-label="Company activity summary">
        <div><strong>{data.totalCommits.toLocaleString()}</strong><span>commits</span></div>
        <div><strong>{data.activeDays}</strong><span>active days</span></div>
        <div><strong>{data.stats.consistency}%</strong><span>consistency</span></div>
        <div className={data.stats.momentum >= 0 ? "positive" : "negative"}>
          <strong>{formatMomentum(data.stats.momentum)}</strong><span>vs previous 30 days</span>
        </div>
      </section>

      <section className="activity-panel">
        <div className="section-heading-row">
          <div>
            <h2>Public shipping activity</h2>
            <p>Non-merge commits across the sampled public repositories.</p>
          </div>
          <div className="inline-period-controls">
            {([
              ["rolling", "Last 12 months"],
              ["current", String(currentYear)],
              ["previous", String(currentYear - 1)],
            ] as const).map(([value, label]) => (
              <button className={period === value ? "active" : ""} key={value} onClick={() => setPeriod(value)} type="button">
                {label}
              </button>
            ))}
          </div>
        </div>
        <ContributionGrid activity={data.activity} org={data.org} period={period} />
      </section>

      <div className="detail-columns">
        <section className="data-panel top-shippers">
          <div className="section-heading-row compact">
            <h2>Top shippers</h2>
            <span>Across {contributors?.sampledRepositories ?? data.sampledRepos.length} sampled repos</span>
          </div>
          {topContributors.length ? (
            <div className="contributors-table">
              {topContributors.map((person, index) => (
                <a href={person.githubUrl} target="_blank" rel="noreferrer" className="contributor-row" key={person.login}>
                  <span className="rank">{index + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.avatarUrl} alt="" width={28} height={28} />
                  <strong>@{person.login}</strong>
                  <span>{person.repositories} repos</span>
                  <span>{person.commits.toLocaleString()}</span>
                  <i><b style={{ width: `${(person.commits / maxContributorCommits) * 100}%` }} /></i>
                </a>
              ))}
            </div>
          ) : contributorError ? (
            <p className="panel-status">{contributorError}. GitHub sometimes needs time to compute contributor statistics.</p>
          ) : (
            <p className="panel-status"><LoaderCircle className="spin" aria-hidden="true" size={16} /> Ranking contributors from sampled repositories…</p>
          )}
          <p className="data-note">Contributor totals come from GitHub&apos;s repository statistics and can differ from the calendar total.</p>
        </section>

        <section className="data-panel shipping-dna">
          <h2>Shipping DNA</h2>
          <dl>
            <div><dt>Peak day</dt><dd>{data.stats.peakDay.count.toLocaleString()} · {formatDate(data.stats.peakDay.date)}</dd></div>
            <div><dt>Longest streak</dt><dd>{data.stats.longestStreak} days</dd></div>
            <div><dt>Current streak</dt><dd>{data.stats.currentStreak} days</dd></div>
            <div><dt>Most active weekday</dt><dd>{data.stats.mostActiveWeekday}</dd></div>
            <div><dt>Weekend ratio</dt><dd>{data.stats.weekendRatio}%</dd></div>
            <div><dt>Average active day</dt><dd>{data.stats.averageActiveDay.toLocaleString()} commits</dd></div>
          </dl>
        </section>
      </div>

      <section className="data-panel repository-pulse">
        <div className="section-heading-row compact">
          <h2>Repository pulse</h2>
          <Link className="outline-button" href={`/compare?orgs=${data.org},vercel`}>
            <GitCompareArrows aria-hidden="true" size={15} />
            Compare {data.name}
          </Link>
        </div>
        <div className="repository-table-wrap">
          <table>
            <thead><tr><th>Repository</th><th>Language</th><th>Stars</th><th>Commits sampled</th><th>Last pushed</th></tr></thead>
            <tbody>
              {data.sampledRepos.map((repo) => (
                <tr key={repo.name}>
                  <td><a href={repo.url} target="_blank" rel="noreferrer">{repo.name}</a></td>
                  <td>{repo.language || "—"}</td>
                  <td>{formatCompactNumber(repo.stars)}</td>
                  <td>{repo.commits.toLocaleString()}</td>
                  <td>{formatRelativeDate(repo.pushedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
