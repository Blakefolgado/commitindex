import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { ContributionGrid } from "@/components/contribution-grid";
import { VelocityChart } from "@/components/velocity-chart";
import { formatMomentum } from "@/lib/analytics";
import type { Company } from "@/lib/companies";
import type { OrganizationActivity } from "@/lib/types";

const comparisonMetrics = [
  { label: "Commits", value: (item: OrganizationActivity) => item.totalCommits.toLocaleString() },
  { label: "Active days", value: (item: OrganizationActivity) => item.activeDays.toLocaleString() },
  { label: "Consistency", value: (item: OrganizationActivity) => `${item.stats.consistency}%` },
  { label: "Momentum", value: (item: OrganizationActivity) => formatMomentum(item.stats.momentum) },
  {
    label: "Lines deleted",
    value: (item: OrganizationActivity) =>
      item.codeFrequencyRepos > 0 ? item.totalDeletions.toLocaleString() : "—",
  },
];

function compareUrl(orgs: string[]) {
  return `/compare?orgs=${orgs.join(",")}`;
}

export function CompareTool({
  availableCompanies,
  items,
}: {
  availableCompanies: Company[];
  items: OrganizationActivity[];
}) {
  const selectedOrgs = items.map((item) => item.org);
  const mobileGridStyle = {
    gridTemplateColumns: `88px repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
  };

  return (
    <main className="compare-shell">
      <div className="page-title">
        <h1>Compare companies</h1>
      </div>

      <form action="/compare" className="compare-form" method="get">
        <div className="compare-selects">
          {[0, 1, 2].map((index) => (
            <select
              aria-label={`Company ${index + 1}`}
              defaultValue={selectedOrgs[index] ?? ""}
              key={index}
              name={`org${index + 1}`}
            >
              <option value="">{index < 2 ? "Choose company" : "Add company"}</option>
              {availableCompanies.map((company) => (
                <option key={company.org} value={company.org}>
                  {company.name}
                </option>
              ))}
            </select>
          ))}
        </div>
        <button className="primary-button" type="submit">Compare</button>
      </form>

      <div className="compare-picker" aria-label="Companies being compared">
        {items.map((item) => (
          <Link
            aria-label={`Remove ${item.name} from comparison`}
            href={compareUrl(selectedOrgs.filter((org) => org !== item.org))}
            key={item.org}
          >
            {item.name}
            <X aria-hidden="true" size={13} />
          </Link>
        ))}
      </div>

      {items.length > 0 ? (
        <>
          <section className="comparison-scoreboard">
            <div className="scoreboard-labels">
              <span>Company</span>
              <span>Commits</span>
              <span>Active days</span>
              <span>Consistency</span>
              <span>Momentum</span>
              <span>Lines deleted</span>
            </div>
            {items.map((item) => (
              <Link href={`/company/${item.org}`} className="scoreboard-row" key={item.org}>
                <span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.avatarUrl} alt="" width={38} height={38} />
                  <strong>{item.name}</strong>
                </span>
                <strong>{item.totalCommits.toLocaleString()}</strong>
                <strong>{item.activeDays}</strong>
                <strong>{item.stats.consistency}%</strong>
                <strong className={item.stats.momentum >= 0 ? "positive" : "negative"}>
                  {formatMomentum(item.stats.momentum)}
                </strong>
                <strong
                  title={`${item.codeFrequencyRepos} of ${item.sampledRepos.length} sampled repositories provide line data`}
                >
                  {item.codeFrequencyRepos > 0 ? item.totalDeletions.toLocaleString() : "—"}
                </strong>
              </Link>
            ))}
          </section>

          <section className="comparison-mobile-matrix" aria-label="Company comparison metrics">
            <div className="matrix-companies" style={mobileGridStyle}>
              <span aria-hidden="true" />
              {items.map((item) => (
                <Link href={`/company/${item.org}`} key={item.org}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.avatarUrl} alt="" width={22} height={22} />
                  <strong>{item.name}</strong>
                </Link>
              ))}
            </div>
            {comparisonMetrics.map(({ label, value }) => (
              <div className="matrix-row" style={mobileGridStyle} key={label}>
                <span>{label}</span>
                {items.map((item) => (
                  <strong
                    className={
                      label === "Momentum"
                        ? item.stats.momentum >= 0 ? "positive" : "negative"
                        : ""
                    }
                    key={item.org}
                  >
                    {value(item)}
                  </strong>
                ))}
              </div>
            ))}
          </section>

          <section className="comparison-velocity" aria-labelledby="comparison-velocity-heading">
            <div className="section-heading-row compact">
              <h2 id="comparison-velocity-heading">Velocity</h2>
            </div>
            <VelocityChart
              ariaLabel={`Commit velocity for ${items.map((item) => item.name).join(", ")}`}
              series={items.map((item) => ({
                activity: item.activity,
                codeFrequency: item.codeFrequency,
                codeFrequencyRepos: item.codeFrequencyRepos,
                momentum: item.stats.momentum,
                name: item.name,
                sampledRepositories: item.sampledRepos.length,
              }))}
            />
          </section>

          <section className="comparison-grids">
            {items.map((item) => (
              <article key={item.org}>
                <div>
                  <h2>{item.name}</h2>
                  <Link href={`/company/${item.org}`}>
                    Deep dive <ArrowRight aria-hidden="true" size={13} />
                  </Link>
                </div>
                <ContributionGrid activity={item.activity} org={item.org} period="rolling" />
              </article>
            ))}
          </section>
        </>
      ) : (
        <div className="empty-state"><h2>Choose companies</h2></div>
      )}
    </main>
  );
}
