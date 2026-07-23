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
      <span className="directory-commits">
        {entry?.totalCommits ? entry.totalCommits.toLocaleString() : "—"}
      </span>
      <ArrowRight className="directory-arrow" aria-hidden="true" size={15} />
    </Link>
  );
}
