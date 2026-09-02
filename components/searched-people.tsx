import Link from "next/link";
import { readPeopleIndex } from "@/lib/people-index";

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
    <section className="leaderboard-panel searched-people">
      <div className="people-table-actions">
        <span>Most recently searched profiles, ranked by the last 12 months</span>
        <Link className="primary-button" href="/people">Search a profile</Link>
      </div>
      <div className="leaderboard-table-wrap">
        <table className="leaderboard-table searched-people-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Person</th>
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
                  <td>{index + 1}</td>
                  <td>
                    <Link className="leader-person" href={`/people?user=${person.login}`}>
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
  );
}
