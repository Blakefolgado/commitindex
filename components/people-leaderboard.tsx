import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import type {
  ContributorWeek,
  PeopleLeaderboardEntry,
  PeopleLeaderboardSnapshot,
} from "@/lib/types";

export type PeopleRankMode = "commits" | "additions" | "deletions" | "repositories";

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

function peopleUrl({
  company,
  limit,
  mode,
  query,
}: {
  company: string;
  limit?: number;
  mode: PeopleRankMode;
  query: string;
}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (company !== "All companies") params.set("company", company);
  if (mode !== "commits") params.set("mode", mode);
  if (limit) params.set("limit", String(limit));
  const search = params.toString();
  return search ? `/leaderboards/people?${search}` : "/leaderboards/people";
}

export function PeopleLeaderboard({
  company,
  limit,
  mode,
  query,
  snapshot,
}: {
  company: string;
  limit: number;
  mode: PeopleRankMode;
  query: string;
  snapshot: PeopleLeaderboardSnapshot;
}) {
  const normalizedQuery = query.toLowerCase().trim();
  const companies = [
    "All companies",
    ...new Set(snapshot.entries.map((entry) => entry.company)),
  ];
  const entries = snapshot.entries
    .filter((entry) => company === "All companies" || entry.company === company)
    .filter((entry) => (
      !normalizedQuery
      || `${entry.login} ${entry.company} ${entry.org}`.toLowerCase().includes(normalizedQuery)
    ))
    .toSorted((left, right) => right[mode] - left[mode]);

  return (
    <main className="leaderboard-shell">
      <div className="page-title">
        <h1>Leaderboards</h1>
      </div>

      <div className="leaderboard-kind-tabs" aria-label="Leaderboard type">
        <Link href="/leaderboards">Companies</Link>
        <Link className="active" href="/leaderboards/people">People</Link>
      </div>

      <form action="/leaderboards/people" className="leaderboard-filters" method="get">
        <label>
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Filter people"
            defaultValue={query}
            name="q"
            placeholder="Filter people…"
          />
        </label>
        <select defaultValue={company} name="company" aria-label="Filter by company">
          {companies.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input name="mode" type="hidden" value={mode} />
        <button className="primary-button" type="submit">Filter</button>
      </form>

      <div className="ranking-tabs people-ranking-tabs" aria-label="People leaderboard measure">
        {peopleModes.map((item) => (
          <Link
            className={mode === item.value ? "active" : ""}
            href={peopleUrl({ company, mode: item.value, query })}
            key={item.value}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <form action="/compare/people" method="get">
        <section className="leaderboard-panel">
          <div className="people-table-actions">
            <span>{entries.length.toLocaleString()} contributors</span>
            <button className="primary-button" type="submit">
              Compare selected <ArrowRight aria-hidden="true" size={14} />
            </button>
          </div>
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
                {entries.slice(0, limit).map((person, index) => (
                  <tr key={person.id}>
                    <td>{index + 1}</td>
                    <td>
                      <a className="leader-person" href={person.githubUrl} target="_blank" rel="noreferrer">
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
                        aria-label={`Compare ${person.login} from ${person.company}`}
                        name="people"
                        type="checkbox"
                        value={person.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!entries.length && <p className="panel-status">No people match these filters.</p>}
          </div>
        </section>
      </form>

      {entries.length > limit && (
        <Link
          className="load-more"
          href={peopleUrl({ company, limit: limit + 30, mode, query })}
        >
          Show more people
        </Link>
      )}
    </main>
  );
}
