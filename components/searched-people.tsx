import Link from "next/link";
import recentlySearchedData from "@/data/recently-searched-people.json";
import type { PersonSummary } from "@/lib/person-summary";
import { peopleSnapshot } from "@/lib/snapshots";

function Sparkline({
  label,
  values,
  window,
}: {
  label: string;
  values: number[];
  window: number;
}) {
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
  const recent = values.slice(-window).reduce((sum, value) => sum + value, 0);
  const previous = values.slice(-window * 2, -window).reduce((sum, value) => sum + value, 0);
  const direction = recent > previous ? "positive" : recent < previous ? "negative" : "neutral";

  return (
    <span aria-label={label} className={`directory-trend ${direction}`} role="img">
      <svg viewBox="0 0 64 21" aria-hidden="true">
        <polygon points={`2,20 ${points} 62,20`} />
        <polyline points={points} />
      </svg>
    </span>
  );
}

const recentlySearched = (recentlySearchedData as { entries: PersonSummary[] }).entries;

function reposLabel(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "repo" : "repos"}`;
}

/**
 * One durable list containing recovered profile searches and repository contributors.
 * Both sources are checked into the repository, so a provider quota cannot blank it.
 */
export function SearchedPeople({ limit = 25 }: { limit?: number }) {
  const directory = [...new Map(
    peopleSnapshot.entries.map((entry) => [entry.login.toLowerCase(), entry]),
  ).values()];
  const directoryByLogin = new Map(directory.map((entry) => [entry.login.toLowerCase(), entry]));
  const recoveredLogins = new Set(recentlySearched.map((entry) => entry.login.toLowerCase()));
  const entries = [
    ...recentlySearched.map((profile) => ({
      directory: directoryByLogin.get(profile.login.toLowerCase()),
      profile,
    })),
    ...directory
      .filter((entry) => !recoveredLogins.has(entry.login.toLowerCase()))
      .map((entry) => ({ directory: entry, profile: undefined })),
  ];

  return (
    <div className="searched-people-shell">
      <h2>People</h2>
      <section className="leaderboard-panel searched-people">
        <div className="people-table-actions">
          <span>{entries.length.toLocaleString()} public GitHub profiles</span>
        </div>
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table searched-people-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Person</th>
                <th>Company</th>
                <th>Activity trend</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, limit).map(({ directory: companyPerson, profile }, index) => {
                const login = profile?.login ?? companyPerson!.login;
                const avatarUrl = profile?.avatarUrl ?? companyPerson!.avatarUrl;
                const trend = profile
                  ? {
                    label: `${login} monthly contributions over three years`,
                    values: profile.months,
                    window: 6,
                  }
                  : {
                    label: `${login} weekly commits over six months`,
                    values: companyPerson!.weeks.map((week) => week.commits),
                    window: 4,
                  };
                return (
                  <tr key={login.toLowerCase()}>
                    <td>{index + 1}</td>
                    <td>
                      <Link className="leader-person" href={`/people?user=${login}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarUrl} alt="" width={30} height={30} />
                        <strong>@{login}</strong>
                      </Link>
                    </td>
                    <td>
                      {companyPerson ? (
                        <Link className="person-company" href={`/company/${companyPerson.org}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={companyPerson.companyAvatarUrl} alt="" width={22} height={22} />
                          <span>{companyPerson.company}</span>
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="searched-people-trend">
                      <Sparkline {...trend} />
                    </td>
                    <td>
                      {profile
                        ? `${profile.contributions12m.toLocaleString()} contributions${
                          companyPerson ? ` · ${reposLabel(companyPerson.repositories)}` : ""
                        }`
                        : `${companyPerson!.commits.toLocaleString()} commits · ${
                          reposLabel(companyPerson!.repositories)
                        }`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {entries.length > limit && (
          <Link className="load-more" href="/leaderboards/people">See all contributors</Link>
        )}
      </section>
    </div>
  );
}
