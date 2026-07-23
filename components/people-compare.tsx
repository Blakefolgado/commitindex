"use client";

import { ArrowLeft, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContributorWeek, PeopleLeaderboardEntry } from "@/lib/types";

type PeopleMetric = "commits" | "additions" | "deletions";

export type PeopleOption = Pick<
  PeopleLeaderboardEntry,
  "id" | "login" | "company" | "org" | "avatarUrl"
>;

const colors = ["#3fb950", "#58a6ff", "#bc8cff"];
const metrics: { value: PeopleMetric; label: string }[] = [
  { value: "commits", label: "Commits" },
  { value: "additions", label: "Added" },
  { value: "deletions", label: "Deleted" },
];

function formatLineMetric(
  person: PeopleLeaderboardEntry,
  metric: "additions" | "deletions",
) {
  return person.additions === 0 && person.deletions === 0
    ? "—"
    : person[metric].toLocaleString();
}

function metricValue(week: ContributorWeek, metric: PeopleMetric) {
  return week[metric];
}

function PeopleTrendChart({
  people,
}: {
  people: PeopleLeaderboardEntry[];
}) {
  const [metric, setMetric] = useState<PeopleMetric>("commits");
  const weekKeys = [...new Set(people.flatMap((person) => person.weeks.map((week) => week.week)))]
    .sort((left, right) => left - right)
    .slice(-26);
  const values = people.flatMap((person) => {
    const weekly = new Map(person.weeks.map((week) => [week.week, week]));
    return weekKeys.map((week) => {
      const item = weekly.get(week);
      return item ? metricValue(item, metric) : 0;
    });
  });
  const maximum = Math.max(...values, 1);

  return (
    <section className="people-comparison-chart" aria-labelledby="people-velocity-heading">
      <div className="section-heading-row compact">
        <h2 id="people-velocity-heading">Velocity</h2>
        <div className="velocity-resolution">
          {metrics.map((item) => (
            <button
              className={metric === item.value ? "active" : ""}
              type="button"
              onClick={() => setMetric(item.value)}
              key={item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <svg
        className="people-line-chart"
        viewBox="0 0 1000 220"
        role="img"
        aria-label={`${metrics.find((item) => item.value === metric)?.label} per week for ${people.map((person) => person.login).join(", ")}`}
      >
        {[45, 95, 145, 195].map((y) => (
          <line className="people-chart-guide" x1="20" x2="980" y1={y} y2={y} key={y} />
        ))}
        {people.map((person, personIndex) => {
          const weekly = new Map(person.weeks.map((week) => [week.week, week]));
          const points = weekKeys.map((week, index) => {
            const value = weekly.get(week);
            const x = 22 + (index / Math.max(weekKeys.length - 1, 1)) * 956;
            const y = 195 - ((value ? metricValue(value, metric) : 0) / maximum) * 170;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ");
          return (
            <polyline
              className="people-chart-line"
              points={points}
              style={{ stroke: colors[personIndex] }}
              key={person.id}
            />
          );
        })}
      </svg>
      <div className="people-chart-legend">
        {people.map((person, index) => (
          <span key={person.id}>
            <i style={{ backgroundColor: colors[index] }} />
            <strong>@{person.login}</strong>
            <small>
              {metric === "commits" ? person.commits.toLocaleString() : formatLineMetric(person, metric)}
            </small>
          </span>
        ))}
      </div>
    </section>
  );
}

export function PeopleCompare({
  people,
  options,
}: {
  people: PeopleLeaderboardEntry[];
  options: PeopleOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedIds = people.map((person) => person.id);
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return options
      .filter((option) => !selectedIds.includes(option.id))
      .filter((option) => (
        !normalized
        || `${option.login} ${option.company} ${option.org}`.toLowerCase().includes(normalized)
      ))
      .slice(0, 8);
  }, [options, query, selectedIds]);

  function navigate(ids: string[]) {
    router.push(`/compare/people?people=${ids.map(encodeURIComponent).join(",")}`);
  }

  return (
    <main className="compare-shell people-compare-shell">
      <div className="page-title people-compare-title">
        <h1>Compare people</h1>
        <Link href="/leaderboards"><ArrowLeft aria-hidden="true" size={14} /> Leaderboards</Link>
      </div>

      <div className="compare-picker" aria-label="People being compared">
        {people.map((person) => (
          <button
            aria-label={`Remove ${person.login} from comparison`}
            type="button"
            onClick={() => navigate(selectedIds.filter((id) => id !== person.id))}
            key={person.id}
          >
            @{person.login} · {person.company}
            <X aria-hidden="true" size={13} />
          </button>
        ))}
        {people.length < 3 && (
          <div
            className="compare-search"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setPickerOpen(false);
              }
            }}
          >
            <Search aria-hidden="true" size={15} />
            <input
              aria-autocomplete="list"
              aria-controls="people-comparison-options"
              aria-expanded={pickerOpen}
              aria-label="Add a person to compare"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="Add person"
              role="combobox"
              spellCheck={false}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPickerOpen(true);
              }}
              onFocus={() => setPickerOpen(true)}
            />
            {pickerOpen && (
              <div className="compare-options" id="people-comparison-options" role="listbox">
                {matches.length ? matches.map((person) => (
                  <button
                    aria-selected={false}
                    key={person.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigate([...selectedIds, person.id])}
                    role="option"
                    type="button"
                  >
                    <strong>@{person.login}</strong>
                    <span>{person.company}</span>
                  </button>
                )) : <span>No matching people</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {people.length ? (
        <>
          <section className="comparison-scoreboard people-scoreboard">
            <div className="scoreboard-labels">
              <span>Person</span><span>Company</span><span>Commits</span><span>Added</span><span>Deleted</span><span>Repos</span>
            </div>
            {people.map((person) => (
              <a href={person.githubUrl} target="_blank" rel="noreferrer" className="scoreboard-row" key={person.id}>
                <span>
                  {/* GitHub avatars are public profile assets. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.avatarUrl} alt="" width={38} height={38} />
                  <strong>@{person.login}</strong>
                </span>
                <strong>{person.company}</strong>
                <strong>{person.commits.toLocaleString()}</strong>
                <strong>{formatLineMetric(person, "additions")}</strong>
                <strong>{formatLineMetric(person, "deletions")}</strong>
                <strong>{person.repositories}</strong>
              </a>
            ))}
          </section>
          <section className="comparison-mobile-matrix" aria-label="People comparison metrics">
            <div
              className="matrix-companies"
              style={{ gridTemplateColumns: `88px repeat(${people.length}, minmax(0, 1fr))` }}
            >
              <span aria-hidden="true" />
              {people.map((person) => (
                <a href={person.githubUrl} target="_blank" rel="noreferrer" key={person.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.avatarUrl} alt="" width={22} height={22} />
                  <strong>@{person.login}</strong>
                </a>
              ))}
            </div>
            {[
              ["Company", (person: PeopleLeaderboardEntry) => person.company],
              ["Commits", (person: PeopleLeaderboardEntry) => person.commits.toLocaleString()],
              ["Added", (person: PeopleLeaderboardEntry) => formatLineMetric(person, "additions")],
              ["Deleted", (person: PeopleLeaderboardEntry) => formatLineMetric(person, "deletions")],
              ["Repos", (person: PeopleLeaderboardEntry) => person.repositories.toLocaleString()],
            ].map(([label, value]) => (
              <div
                className="matrix-row"
                style={{ gridTemplateColumns: `88px repeat(${people.length}, minmax(0, 1fr))` }}
                key={label as string}
              >
                <span>{label as string}</span>
                {people.map((person) => (
                  <strong key={person.id}>
                    {(value as (entry: PeopleLeaderboardEntry) => string)(person)}
                  </strong>
                ))}
              </div>
            ))}
          </section>
          <PeopleTrendChart people={people} />
        </>
      ) : (
        <div className="empty-state"><h2>Add a person</h2></div>
      )}
    </main>
  );
}
