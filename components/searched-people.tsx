import Link from "next/link";
import { peopleSnapshot } from "@/lib/snapshots";

function Sparkline({ login, values }: { login: string; values: number[] }) {
  if (values.length < 2) return null;
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const range = Math.max(maximum - minimum, 1);
  const points = values
    .map((value, index) => {
      const x = 2 + (index / (values.length - 1)) * 60;
      const y = 19 - ((value - minimum) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const recent = values.slice(-4).reduce((sum, value) => sum + value, 0);
  const previous = values.slice(-8, -4).reduce((sum, value) => sum + value, 0);
  const direction = recent > previous ? "positive" : recent < previous ? "negative" : "neutral";

  return (
    <span
      aria-label={`${login} weekly commits over six months`}
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

/**
 * A durable people directory sourced from the generated repository snapshot.
 * It has no runtime storage dependency, so a provider quota cannot blank it.
 */
export function SearchedPeople({ limit = 25 }: { limit?: number }) {
  const entries = [...new Map(
    peopleSnapshot.entries.map((entry) => [entry.login.toLowerCase(), entry]),
  ).values()];

  return (
    <div className="searched-people-shell">
      <h2>People</h2>
      <form action="/compare/people" method="get">
        <section className="leaderboard-panel searched-people">
          <div className="people-table-actions">
            <span>{entries.length.toLocaleString()} public contributors across indexed company repositories</span>
            <button className="primary-button" type="submit">Compare selected</button>
          </div>
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table searched-people-table">
              <thead>
                <tr>
                  <th><span className="sr-only">Compare</span></th>
                  <th>Rank</th>
                  <th>Person</th>
                  <th>Company</th>
                  <th>6 month trend</th>
                  <th>Commits</th>
                  <th>Repos</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, limit).map((person, index) => (
                  <tr key={person.id}>
                    <td className="searched-people-pick">
                      <input
                        aria-label={`Compare ${person.login} from ${person.company}`}
                        name="people"
                        type="checkbox"
                        value={person.id}
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
                    <td>
                      <Link className="person-company" href={`/company/${person.org}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={person.companyAvatarUrl} alt="" width={22} height={22} />
                        <span>{person.company}</span>
                      </Link>
                    </td>
                    <td className="searched-people-trend">
                      <Sparkline login={person.login} values={person.weeks.map((week) => week.commits)} />
                    </td>
                    <td>{person.commits.toLocaleString()}</td>
                    <td>{person.repositories.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {entries.length > limit && (
            <Link className="load-more" href="/leaderboards/people">See all people</Link>
          )}
        </section>
      </form>
    </div>
  );
}
