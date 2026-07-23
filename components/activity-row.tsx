import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Company } from "@/lib/companies";
import type { LeaderboardEntry } from "@/lib/types";

function weeklyTotals(entry?: LeaderboardEntry) {
  const days = entry?.activity.slice(-84) ?? [];
  return Array.from({ length: 12 }, (_, week) =>
    days.slice(week * 7, week * 7 + 7).reduce((sum, day) => sum + day.count, 0),
  );
}

function activityLevel(value: number, max: number) {
  if (!value || !max) return 0;
  return Math.max(1, Math.min(4, Math.ceil((value / max) * 4)));
}

function ActivityTrend({
  company,
  totalCommits,
  values,
}: {
  company: string;
  totalCommits?: number;
  values: number[];
}) {
  if (totalCommits === undefined) {
    return (
      <span className="directory-trend unavailable" aria-label={`Activity snapshot unavailable for ${company}`}>
        <span aria-hidden="true">—</span>
      </span>
    );
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 1);
  const points = values
    .map((value, index) => {
      const x = 2 + (index / Math.max(values.length - 1, 1)) * 60;
      const y = 19 - ((value - minimum) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const recent = values.slice(-4).reduce((sum, value) => sum + value, 0);
  const previous = values.slice(-8, -4).reduce((sum, value) => sum + value, 0);
  const direction = recent > previous ? "positive" : recent < previous ? "negative" : "neutral";
  const directionLabel = direction === "positive" ? "growing" : direction === "negative" ? "slowing" : "flat";
  const label = `${company} shipped ${totalCommits.toLocaleString()} sampled public commits; 12-week activity is ${directionLabel}`;

  return (
    <span className={`directory-trend ${direction}`} role="img" aria-label={label}>
      <svg viewBox="0 0 64 21" aria-hidden="true">
        <polygon points={`2,20 ${points} 62,20`} />
        <polyline points={points} />
      </svg>
      <span aria-hidden="true">{totalCommits.toLocaleString()}</span>
    </span>
  );
}

export function ActivityRow({
  company,
  entry,
  rank,
}: {
  company: Company;
  entry?: LeaderboardEntry;
  rank: number;
}) {
  const totals = weeklyTotals(entry);
  const max = Math.max(...totals, 0);

  return (
    <Link className="directory-row" href={`/company/${company.org}`}>
      <span className="directory-rank">{rank}</span>
      <span className="directory-company">
        {entry?.avatarUrl ? (
          // GitHub avatar URLs are public organisation assets.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatarUrl} alt="" width={28} height={28} />
        ) : (
          <span className="directory-avatar-placeholder">{company.name.slice(0, 1)}</span>
        )}
        <strong>{company.name}</strong>
      </span>
      <span
        className="directory-activity"
        role="img"
        aria-label={
          entry?.totalCommits
            ? `${company.name} public activity over the past 12 weeks`
            : `Activity snapshot unavailable for ${company.name}`
        }
      >
        {totals.map((total, index) => (
          <i className={`level-${activityLevel(total, max)}`} aria-hidden="true" key={index} />
        ))}
      </span>
      <ActivityTrend company={company.name} totalCommits={entry?.totalCommits} values={totals} />
      <ArrowRight className="directory-arrow" aria-hidden="true" size={15} />
    </Link>
  );
}
