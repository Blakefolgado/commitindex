"use client";

import { ArrowRight, GitCompareArrows, LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type {
  ContributorWeek,
  PeopleLeaderboardEntry,
  PeopleLeaderboardSnapshot,
} from "@/lib/types";

type PeopleRankMode = "commits" | "additions" | "deletions" | "repositories";

const peopleModes: { value: PeopleRankMode; label: string }[] = [
  { value: "commits", label: "Commits" },
  { value: "additions", label: "Added" },
  { value: "deletions", label: "Deleted" },
  { value: "repositories", label: "Repos" },
];

function weekValue(week: ContributorWeek, mode: PeopleRankMode) {
  if (mode === "repositories") return week.commits;
  return week[mode];
}

function formatLineMetric(
  person: PeopleLeaderboardEntry,
  metric: "additions" | "deletions",
) {
  return person.additions === 0 && person.deletions === 0
    ? "—"
    : person[metric].toLocaleString();
}

function PersonTrend({
  person,
  mode,
}: {
  person: PeopleLeaderboardEntry;
  mode: PeopleRankMode;
}) {
  const values = person.weeks.slice(-12).map((week) => weekValue(week, mode));
  if (!values.length) return <span>—</span>;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 1);
  const points = values.map((value, index) => {
    const x = 2 + (index / Math.max(values.length - 1, 1)) * 92;
    const y = 25 - ((value - minimum) / range) * 22;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const recent = values.slice(-4).reduce((sum, value) => sum + value, 0);
  const previous = values.slice(-8, -4).reduce((sum, value) => sum + value, 0);
  const rising = recent >= previous;
  const label = `${person.login} ${peopleModes.find((item) => item.value === mode)?.label.toLowerCase()} trend over 12 weeks`;

  return (
    <svg
      className={`person-sparkline ${rising ? "positive" : "negative"}`}
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

export function PeopleLeaderboard() {
  const [snapshot, setSnapshot] = useState<PeopleLeaderboardSnapshot | null>(null);
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("All companies");
  const [mode, setMode] = useState<PeopleRankMode>("commits");
  const [selected, setSelected] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const deferredQuery = useDeferredValue(query.toLowerCase().trim());

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/people", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load people");
        return payload as PeopleLeaderboardSnapshot;
      })
      .then(setSnapshot)
      .catch((reason) => {
        if (reason.name !== "AbortError") {
          setError(reason instanceof Error ? reason.message : "Could not load people");
        }
      });
    return () => controller.abort();
  }, [retryVersion]);

  const companies = useMemo(() => [
    "All companies",
    ...new Set(snapshot?.entries.map((entry) => entry.company) ?? []),
  ], [snapshot]);
  const entries = useMemo(() => (snapshot?.entries ?? [])
    .filter((entry) => company === "All companies" || entry.company === company)
    .filter((entry) => (
      !deferredQuery
      || `${entry.login} ${entry.company} ${entry.org}`.toLowerCase().includes(deferredQuery)
    ))
    .toSorted((left, right) => right[mode] - left[mode]), [
    company,
    deferredQuery,
    mode,
    snapshot,
  ]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current);
  }

  if (!snapshot && !error) {
    return (
      <section className="leaderboard-panel people-loading">
        <LoaderCircle className="spin" aria-hidden="true" size={17} />
        Loading people…
      </section>
    );
  }

  if (error) {
    return (
      <section className="leaderboard-panel people-loading" role="alert">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => {
            setError("");
            setSnapshot(null);
            setRetryVersion((current) => current + 1);
          }}
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <>
      <div className="leaderboard-filters">
        <label>
          <Search aria-hidden="true" size={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(20);
            }}
            placeholder="Filter people…"
            aria-label="Filter people"
          />
        </label>
        <select
          value={company}
          onChange={(event) => {
            setCompany(event.target.value);
            setVisibleCount(20);
          }}
          aria-label="Filter by company"
        >
          {companies.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="ranking-tabs people-ranking-tabs" aria-label="People leaderboard measure">
        {peopleModes.map((item) => (
          <button
            className={mode === item.value ? "active" : ""}
            onClick={() => {
              setMode(item.value);
              setVisibleCount(20);
            }}
            type="button"
            key={item.value}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="leaderboard-panel">
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table people-table">
            <colgroup>
              <col className="people-col-rank" />
              <col className="people-col-person" />
              <col className="people-col-company" />
              <col className="people-col-trend" />
              <col className="people-col-commits" />
              <col className="people-col-added" />
              <col className="people-col-deleted" />
              <col className="people-col-repos" />
              <col className="people-col-compare" />
            </colgroup>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Person</th>
                <th title="Company repository set, not verified employment">Company</th>
                <th>12 week trend</th>
                <th>Commits</th>
                <th>Added</th>
                <th>Deleted</th>
                <th>Repos</th>
                <th><span className="sr-only">Compare</span></th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, visibleCount).map((person, index) => (
                <tr className={selected.includes(person.id) ? "selected" : ""} key={person.id}>
                  <td>{index + 1}</td>
                  <td>
                    <a className="leader-person" href={person.githubUrl} target="_blank" rel="noreferrer">
                      {/* GitHub avatars are public profile assets. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={person.avatarUrl} alt="" width={30} height={30} />
                      <strong>@{person.login}</strong>
                    </a>
                  </td>
                  <td>
                    <Link className="person-company" href={`/company/${person.org}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={person.companyAvatarUrl} alt="" width={22} height={22} />
                      <span>{person.company}</span>
                    </Link>
                  </td>
                  <td><PersonTrend person={person} mode={mode} /></td>
                  <td>{person.commits.toLocaleString()}</td>
                  <td>{formatLineMetric(person, "additions")}</td>
                  <td>{formatLineMetric(person, "deletions")}</td>
                  <td>{person.repositories}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(person.id)}
                      onChange={() => toggle(person.id)}
                      aria-label={`Compare ${person.login} from ${person.company}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!entries.length && <p className="panel-status">No people match these filters.</p>}
        </div>
      </section>

      {entries.length > visibleCount && (
        <button
          className="load-more"
          type="button"
          onClick={() => setVisibleCount((count) => count + 30)}
        >
          Show more people
        </button>
      )}

      {selected.length > 0 && (
        <div className="compare-tray">
          <span><GitCompareArrows aria-hidden="true" size={17} /> Compare up to 3 people</span>
          <div className="compare-selections">
            {selected.map((id) => {
              const person = snapshot?.entries.find((entry) => entry.id === id);
              return person ? (
                <button type="button" onClick={() => toggle(id)} key={id}>
                  @{person.login} ×
                </button>
              ) : null;
            })}
          </div>
          <small>{selected.length} / 3 selected</small>
          <Link
            className="primary-button"
            href={`/compare/people?people=${selected.map(encodeURIComponent).join(",")}`}
          >
            Compare <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
      )}
    </>
  );
}
