"use client";

import { ArrowRight, GitCompareArrows, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { formatCompactNumber, formatMomentum } from "@/lib/analytics";
import { MiniHeatmap } from "@/components/mini-heatmap";
import type { ActivityDay, LeaderboardEntry, LeaderboardSnapshot } from "@/lib/types";

type RankMode = "totalCommits" | "consistency" | "momentum" | "activeDays" | "weekendRatio";

const modes: { value: RankMode; label: string }[] = [
  { value: "totalCommits", label: "Commits" },
  { value: "consistency", label: "Consistency" },
  { value: "momentum", label: "Momentum" },
  { value: "activeDays", label: "Active days" },
  { value: "weekendRatio", label: "Weekend energy" },
];

function valueFor(entry: LeaderboardEntry, mode: RankMode) {
  if (mode === "consistency") return entry.stats.consistency;
  if (mode === "momentum") return entry.stats.momentum;
  if (mode === "weekendRatio") return entry.stats.weekendRatio;
  return entry[mode];
}

function MomentumSparkline({
  activity,
  momentum,
}: {
  activity: ActivityDay[];
  momentum: number;
}) {
  const days = activity.slice(-84);
  const weekly = Array.from({ length: 12 }, (_, index) => (
    days.slice(index * 7, (index + 1) * 7).reduce((sum, day) => sum + day.count, 0)
  ));
  const minimum = Math.min(...weekly);
  const maximum = Math.max(...weekly);
  const range = Math.max(maximum - minimum, 1);
  const points = weekly.map((total, index) => {
    const x = 2 + (index / Math.max(weekly.length - 1, 1)) * 92;
    const y = 25 - ((total - minimum) / range) * 22;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const label = `12 week activity trend. 30 day momentum ${formatMomentum(momentum)}.`;

  return (
    <svg
      className={`momentum-sparkline ${momentum >= 0 ? "positive" : "negative"}`}
      viewBox="0 0 96 28"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <polygon points={`2,27 ${points} 94,27`} aria-hidden="true" />
      <polyline points={points} aria-hidden="true" />
    </svg>
  );
}

function FieldNote({
  label,
  entry,
  value,
}: {
  label: string;
  entry: LeaderboardEntry;
  value: string;
}) {
  return (
    <Link href={`/company/${entry.org}`} className="field-note">
      <span>{label}</span>
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.avatarUrl} alt="" width={32} height={32} />
        <strong>{entry.name}</strong>
      </div>
      <p>{value}</p>
    </Link>
  );
}

export function LeaderboardClient({ snapshot }: { snapshot: LeaderboardSnapshot }) {
  const [mode, setMode] = useState<RankMode>("totalCommits");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const deferredQuery = useDeferredValue(query.toLowerCase().trim());
  const categories = useMemo(
    () => ["All", ...new Set(snapshot.entries.map((entry) => entry.category))],
    [snapshot.entries],
  );

  const entries = useMemo(() => snapshot.entries
    .filter((entry) => category === "All" || entry.category === category)
    .filter((entry) => !deferredQuery || `${entry.name} ${entry.org} ${entry.description}`.toLowerCase().includes(deferredQuery))
    .toSorted((a, b) => valueFor(b, mode) - valueFor(a, mode)), [category, deferredQuery, mode, snapshot.entries]);

  const relentless = snapshot.entries.toSorted((a, b) => b.stats.consistency - a.stats.consistency)[0];
  const accelerating = snapshot.entries.toSorted((a, b) => b.stats.momentum - a.stats.momentum)[0];
  const weekend = snapshot.entries.toSorted((a, b) => b.stats.weekendRatio - a.stats.weekendRatio)[0];
  const daySeed = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
  const rabbitHole = snapshot.entries[daySeed % Math.max(snapshot.entries.length, 1)];
  function toggle(org: string) {
    setSelected((current) => current.includes(org)
      ? current.filter((item) => item !== org)
      : current.length < 3 ? [...current, org] : current);
  }

  return (
    <main className="leaderboard-shell">
      <div className="page-title">
        <h1>Leaderboards</h1>
      </div>

      <div className="leaderboard-filters">
        <label>
          <Search aria-hidden="true" size={16} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(10); }} placeholder="Filter companies…" aria-label="Filter companies" />
        </label>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setVisibleCount(10); }} aria-label="Filter by category">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="ranking-tabs" aria-label="Leaderboard measure">
        {modes.map((item) => (
          <button className={mode === item.value ? "active" : ""} onClick={() => { setMode(item.value); setVisibleCount(10); }} type="button" key={item.value}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="leaderboard-panel">
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <colgroup>
              <col className="leaderboard-col-rank" />
              <col className="leaderboard-col-company" />
              <col className="leaderboard-col-activity" />
              <col className="leaderboard-col-commits" />
              <col className="leaderboard-col-days" />
              <col className="leaderboard-col-consistency" />
              <col className="leaderboard-col-momentum" />
              <col className="leaderboard-col-repo" />
              <col className="leaderboard-col-compare" />
            </colgroup>
            <thead>
              <tr><th>Rank</th><th>Company</th><th>Recent activity</th><th>Commits</th><th>Active days</th><th>Consistency</th><th>Momentum</th><th>Top public repo</th><th><span className="sr-only">Compare</span></th></tr>
            </thead>
            <tbody>
              {entries.slice(0, visibleCount).map((entry, index) => (
                <tr className={selected.includes(entry.org) ? "selected" : ""} key={entry.org}>
                  <td>{index + 1}</td>
                  <td>
                    <Link className="leader-company" href={`/company/${entry.org}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.avatarUrl} alt="" width={30} height={30} />
                      <strong>{entry.name}</strong>
                    </Link>
                  </td>
                  <td><MiniHeatmap activity={entry.activity} /></td>
                  <td>{entry.totalCommits ? entry.totalCommits.toLocaleString() : "No stats"}</td>
                  <td>{entry.totalCommits ? entry.activeDays : "—"}</td>
                  <td>{entry.totalCommits ? `${entry.stats.consistency}%` : "—"}</td>
                  <td>
                    {entry.totalCommits
                      ? <MomentumSparkline activity={entry.activity} momentum={entry.stats.momentum} />
                      : "—"}
                  </td>
                  <td>{entry.topRepo ? <a className="leader-repo" href={entry.topRepo.url} target="_blank" rel="noreferrer">{entry.org}/{entry.topRepo.name}</a> : "—"}</td>
                  <td>
                    <input type="checkbox" checked={selected.includes(entry.org)} onChange={() => toggle(entry.org)} aria-label={`Compare ${entry.name}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!entries.length && <p className="panel-status">No companies match these filters.</p>}
        </div>
      </section>
      {entries.length > visibleCount && (
        <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 20)}>
          Show more companies
        </button>
      )}

      {relentless && accelerating && weekend && rabbitHole && (
        <section className="field-notes">
          <h2>Field notes</h2>
          <div>
            <FieldNote label="Most relentless" entry={relentless} value={`${relentless.stats.consistency}% consistency over the past 12 months.`} />
            <FieldNote label="Biggest acceleration" entry={accelerating} value={`${formatMomentum(accelerating.stats.momentum)} momentum in the last 30 days.`} />
            <FieldNote label="Weekend crew" entry={weekend} value={`${weekend.stats.weekendRatio}% of sampled commits happen on weekends.`} />
            <FieldNote label="Today's rabbit hole" entry={rabbitHole} value={`${formatCompactNumber(rabbitHole.totalCommits)} sampled commits and ${rabbitHole.activeDays} active days.`} />
          </div>
        </section>
      )}

      {selected.length > 0 && (
        <div className="compare-tray">
          <span><GitCompareArrows aria-hidden="true" size={17} /> Compare up to 3 companies</span>
          <div className="compare-selections">
            {selected.map((org) => {
              const entry = snapshot.entries.find((item) => item.org === org);
              return entry ? <button type="button" onClick={() => toggle(org)} key={org}>{entry.name} ×</button> : null;
            })}
          </div>
          <small>{selected.length} / 3 selected</small>
          <Link className="primary-button" href={`/compare?orgs=${selected.join(",")}`}>Compare <ArrowRight aria-hidden="true" size={15} /></Link>
        </div>
      )}
    </main>
  );
}
