"use client";

import { ArrowRight, LoaderCircle, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ContributionGrid } from "@/components/contribution-grid";
import { companies } from "@/lib/companies";
import { calculateOrganizationStats, formatMomentum } from "@/lib/analytics";
import type { OrganizationActivity } from "@/lib/types";

export function CompareTool({ initialOrgs }: { initialOrgs: string[] }) {
  const [orgs, setOrgs] = useState(initialOrgs.slice(0, 3));
  const [data, setData] = useState<Record<string, OrganizationActivity>>({});
  const [loading, setLoading] = useState<string[]>(initialOrgs.slice(0, 3));
  const available = useMemo(() => companies.filter((company) => !orgs.includes(company.org)), [orgs]);

  useEffect(() => {
    const controllers = orgs.map((org) => {
      const controller = new AbortController();
      setLoading((current) => current.includes(org) ? current : [...current, org]);
      fetch(`/api/organizations/${encodeURIComponent(org)}?v=2`, { signal: controller.signal })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error);
          return payload as OrganizationActivity;
        })
        .then((payload) => setData((current) => ({
          ...current,
          [org]: {
            ...payload,
            stats: payload.stats || calculateOrganizationStats(payload.activity),
          },
        })))
        .catch((error) => {
          if (error.name !== "AbortError") console.error(`Could not load ${org}`, error);
        })
        .finally(() => setLoading((current) => current.filter((item) => item !== org)));
      return controller;
    });
    const params = new URLSearchParams(window.location.search);
    params.set("orgs", orgs.join(","));
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
    return () => controllers.forEach((controller) => controller?.abort());
  }, [orgs]);

  function add(org: string) {
    if (org && orgs.length < 3) setOrgs((current) => [...current, org]);
  }

  return (
    <main className="compare-shell">
      <div className="page-title">
        <h1>Company comparison</h1>
        <p>Put up to three public GitHub organisations on the same measuring stick.</p>
      </div>

      <div className="compare-picker">
        {orgs.map((org) => {
          const company = companies.find((item) => item.org === org);
          return <button type="button" onClick={() => setOrgs((current) => current.filter((item) => item !== org))} key={org}>{company?.name || org}<X size={13} /></button>;
        })}
        {orgs.length < 3 && (
          <label><Plus aria-hidden="true" size={15} /><select defaultValue="" onChange={(event) => { add(event.target.value); event.currentTarget.value = ""; }}><option value="" disabled>Add a company</option>{available.map((company) => <option value={company.org} key={company.org}>{company.name}</option>)}</select></label>
        )}
      </div>

      <section className="comparison-scoreboard">
        <div className="scoreboard-labels"><span>Company</span><span>Commits</span><span>Active days</span><span>Consistency</span><span>Momentum</span><span>Weekend</span></div>
        {orgs.map((org) => {
          const item = data[org];
          return item ? (
            <Link href={`/company/${org}`} className="scoreboard-row" key={org}>
              <span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.avatarUrl} alt="" width={38} height={38} />
                <strong>{item.name}</strong>
              </span>
              <strong>{item.totalCommits.toLocaleString()}</strong>
              <strong>{item.activeDays}</strong>
              <strong>{item.stats.consistency}%</strong>
              <strong className={item.stats.momentum >= 0 ? "positive" : "negative"}>{formatMomentum(item.stats.momentum)}</strong>
              <strong>{item.stats.weekendRatio}%</strong>
            </Link>
          ) : (
            <div className="scoreboard-loading" key={org}><LoaderCircle className="spin" size={17} /> Loading {org}…</div>
          );
        })}
      </section>

      <section className="comparison-grids">
        {orgs.map((org) => {
          const item = data[org];
          return item ? (
            <article key={org}>
              <div><h2>{item.name}</h2><Link href={`/company/${org}`}>Deep dive <ArrowRight size={13} /></Link></div>
              <ContributionGrid activity={item.activity} org={item.org} period="rolling" />
              <p>{item.coverage}</p>
            </article>
          ) : null;
        })}
      </section>

      {!orgs.length && <div className="empty-state"><h2>Add a company to begin</h2><p>Choose from the curated directory above.</p></div>}
      {loading.length > 0 && <span className="compare-loading-note">Loading {loading.length} live {loading.length === 1 ? "profile" : "profiles"} from GitHub…</span>}
    </main>
  );
}
