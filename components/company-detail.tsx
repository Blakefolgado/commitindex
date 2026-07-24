import { ArrowUpRight, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { formatCompactNumber, formatMomentum } from "@/lib/analytics";
import { ContributionGridSelector } from "@/components/contribution-grid-selector";
import { ShareButton } from "@/components/share-button";
import { VelocityChart } from "@/components/velocity-chart";
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

export function CompanyDetail({
  contributors,
  data,
}: {
  contributors?: ContributorsPayload;
  data: OrganizationActivity;
}) {
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
          <Link className="outline-button" href={`/compare?orgs=${data.org}`}>
            <GitCompareArrows aria-hidden="true" size={15} />
            Compare
          </Link>
          <ShareButton title={`${data.name} public GitHub activity`} />
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
          <h2>Public shipping activity</h2>
        </div>
        <ContributionGridSelector activity={data.activity} org={data.org} />
      </section>

      <section className="velocity-panel" aria-labelledby="velocity-heading">
        <div className="velocity-heading">
          <h2 id="velocity-heading">Velocity</h2>
        </div>
        <VelocityChart
          ariaLabel={`${data.name} commit velocity`}
          series={[{
            activity: data.activity,
            codeFrequency: data.codeFrequency,
            codeFrequencyRepos: data.codeFrequencyRepos,
            momentum: data.stats.momentum,
            name: data.name,
            sampledRepositories: data.sampledRepos.length,
          }]}
        />
      </section>

      <div className="detail-columns">
        <section className="data-panel top-shippers">
          <div className="section-heading-row compact">
            <h2>Top shippers</h2>
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
          ) : (
            <p className="panel-status">No stored contributor statistics.</p>
          )}
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
