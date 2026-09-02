import type { Metadata } from "next";
import Link from "next/link";
import { readPeopleIndex, type PeopleIndexEntry } from "@/lib/people-index";

export const revalidate = 10;

export const metadata: Metadata = {
  title: "Compare how much people are shipping — Commit Index",
  description: "Put two or more public GitHub contribution histories side by side over the last three years.",
  alternates: { canonical: "/people/compare" },
};

const lineColors = ["#39d353", "#58a6ff", "#f778ba", "#e3b341", "#a371f7", "#ff7b72"];
const chart = { width: 1000, height: 300, inset: 12 };

function monthLabel(index: number, total: number) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - (total - index));
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

function seriesPoints(months: number[], maximum: number, longest: number) {
  // Series are right-aligned: everyone's last month is the same month.
  const offset = longest - months.length;
  return months
    .map((total, index) => {
      const x = chart.inset
        + ((index + offset) / Math.max(longest - 1, 1)) * (chart.width - chart.inset * 2);
      const y = chart.inset + (1 - total / maximum) * (chart.height - chart.inset * 2);
      return `${Math.round(x)},${Math.round(y)}`;
    })
    .join(" ");
}

export default async function ComparePeople({
  searchParams,
}: {
  searchParams: Promise<{ users?: string | string[] }>;
}) {
  const params = await searchParams;
  const wanted = (Array.isArray(params.users) ? params.users : [params.users])
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const index = await readPeopleIndex();
  const people = wanted
    .map((login) => index.find((entry) => entry.login.toLowerCase() === login))
    .filter((entry): entry is PeopleIndexEntry => Boolean(entry?.months?.length));

  if (!people.length) {
    return (
      <main className="people-shell">
        <header className="people-intro"><h1>Compare</h1></header>
        <p className="panel-status">
          Pick two or more profiles on the <Link href="/people">people page</Link> to compare them.
        </p>
      </main>
    );
  }

  const longest = Math.max(...people.map((person) => person.months.length));
  const maximum = Math.max(...people.flatMap((person) => person.months), 1);

  return (
    <main className="people-shell">
      <header className="people-intro">
        <h1>Compare</h1>
      </header>

      <section className="leaderboard-panel compare-people">
        <div className="people-table-actions">
          <span>Contributions per month, last 3 years</span>
          <Link className="primary-button" href="/people">Back to people</Link>
        </div>

        <svg
          className="compare-people-chart"
          role="img"
          aria-label={`Monthly contributions for ${people.map((person) => person.login).join(", ")}`}
          viewBox={`0 0 ${chart.width} ${chart.height}`}
        >
          {[0.25, 0.5, 0.75].map((step) => (
            <line
              key={step}
              stroke="#21262d"
              strokeDasharray="3 6"
              x1={chart.inset}
              x2={chart.width - chart.inset}
              y1={chart.inset + step * (chart.height - chart.inset * 2)}
              y2={chart.inset + step * (chart.height - chart.inset * 2)}
            />
          ))}
          {people.map((person, order) => (
            <polyline
              fill="none"
              key={person.login}
              points={seriesPoints(person.months, maximum, longest)}
              stroke={lineColors[order % lineColors.length]}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          ))}
        </svg>

        <div className="compare-people-axis">
          <span>{monthLabel(0, longest)}</span>
          <span>{monthLabel(longest - 1, longest)}</span>
        </div>

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table searched-people-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Last 30 days</th>
                <th>Last 12 months</th>
                <th>Acceleration</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person, order) => {
                const change = person.contributionsPrior12m
                  ? Math.round(
                    ((person.contributions12m - person.contributionsPrior12m)
                      / person.contributionsPrior12m) * 100,
                  )
                  : null;
                return (
                  <tr key={person.login}>
                    <td>
                      <Link className="leader-person" href={`/people?user=${person.login}`}>
                        <span
                          className="compare-people-key"
                          style={{ background: lineColors[order % lineColors.length] }}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={person.avatarUrl} alt="" width={30} height={30} />
                        <strong>@{person.login}</strong>
                      </Link>
                    </td>
                    <td>{person.contributions30d.toLocaleString()}</td>
                    <td>{person.contributions12m.toLocaleString()}</td>
                    <td className={change !== null && change >= 0 ? "trend-up" : "trend-down"}>
                      {change === null ? "—" : `${change >= 0 ? "+" : ""}${change}%`}
                    </td>
                    <td>{person.streak}d</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
