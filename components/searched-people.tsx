import Link from "next/link";
import { readPeopleIndex } from "@/lib/people-index";

function Sparkline({ login, months }: { login: string; months: number[] }) {
  if (months.length < 2) return null;
  const maximum = Math.max(...months);
  const minimum = Math.min(...months);
  const range = Math.max(maximum - minimum, 1);
  const points = months
    .map((value, index) => {
      const x = 2 + (index / (months.length - 1)) * 60;
      const y = 19 - ((value - minimum) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const recent = months.slice(-6).reduce((sum, value) => sum + value, 0);
  const previous = months.slice(-12, -6).reduce((sum, value) => sum + value, 0);
  const direction = recent > previous ? "positive" : recent < previous ? "negative" : "neutral";

  return (
    <span
      aria-label={`${login} monthly contributions over three years`}
      className={`directory-trend ${direction}`}
      role="img"
    >
      <svg viewBox="0 0 64 21" aria-hidden="true">
        <polygon points={`2,20 ${points} 62,20`} />
        <polyline points={points} />
      </svg>
    </span>
  );
}

function acceleration(current: number, prior: number) {
  if (!prior) return null;
  return Math.round(((current - prior) / prior) * 100);
}

/**
 * Everyone who has been looked up on /people, ranked by the last 12 months.
 * Server component: the index lives in Blob storage, refreshed on each lookup.
 */
export async function SearchedPeople({ limit = 25 }: { limit?: number }) {
  const entries = await readPeopleIndex();
  if (!entries.length) return null;

  return (
    <div className="searched-people-shell">
      <h2>Recently searched</h2>
      <form action="/people/compare" method="get">
      <section className="leaderboard-panel searched-people">
      <div className="people-table-actions">
        <span>Most recently searched profiles, ranked by the last 12 months</span>
        <button className="primary-button" type="submit">Compare selected</button>
      </div>
      <div className="leaderboard-table-wrap">
        <table className="leaderboard-table searched-people-table">
          <thead>
            <tr>
              <th><span className="sr-only">Compare</span></th>
              <th>Rank</th>
              <th>Person</th>
              <th>3 year trend</th>
              <th>Last 30 days</th>
              <th>Last 12 months</th>
              <th>Acceleration</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, limit).map((person, index) => {
              const change = acceleration(person.contributions12m, person.contributionsPrior12m);
              return (
                <tr key={person.login}>
                  <td className="searched-people-pick">
                    <input
                      aria-label={`Compare ${person.login}`}
                      name="users"
                      type="checkbox"
                      value={person.login}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td>
                    <Link className="leader-person" href={`/people?user=${person.login}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={person.avatarUrl} alt="" width={30} height={30} />
                      <strong>@{person.login}</strong>
                    </Link>
                  </td>
                  <td className="searched-people-trend">
                    <Sparkline login={person.login} months={person.months ?? []} />
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
      </form>
    </div>
  );
}
