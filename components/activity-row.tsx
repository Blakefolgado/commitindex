"use client";

import { AlertCircle, ArrowUpRight, LoaderCircle, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ContributionGrid } from "@/components/contribution-grid";
import type { Company } from "@/lib/companies";
import type { OrganizationActivity } from "@/lib/types";

type Period = "rolling" | "current" | "previous";

export function ActivityRow({ company, eager }: { company: Company; eager: boolean }) {
  const rowRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [data, setData] = useState<OrganizationActivity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("rolling");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (shouldLoad) return;
    const element = rowRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    const controller = new AbortController();
    fetch(`/api/organizations/${encodeURIComponent(company.org)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load activity");
        return payload as OrganizationActivity;
      })
      .then(setData)
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [company.org, shouldLoad]);

  function retry() {
    setShouldLoad(false);
    setData(null);
    setError(null);
    requestAnimationFrame(() => setShouldLoad(true));
  }

  return (
    <article className="company-row" ref={rowRef}>
      <div className="company-identity">
        {data ? (
          // GitHub avatar URLs are public organisation assets.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.avatarUrl} alt="" width={48} height={48} />
        ) : (
          <div className="avatar-placeholder">{company.name.slice(0, 1)}</div>
        )}
        <div>
          <h2><Link href={`/company/${company.org}`}>{data?.name || company.name}</Link></h2>
          <p>{data?.description || company.description}</p>
          {data && (
            <div className="company-meta">
              <span>{data.publicRepos.toLocaleString()} public repos</span>
              <span>{data.totalCommits.toLocaleString()} commits</span>
            </div>
          )}
        </div>
      </div>

      <div className="activity-region">
        {data ? (
          <>
            <ContributionGrid activity={data.activity} org={data.org} period={period} />
            <div className="coverage-line">
              <span>{data.coverage}</span>
              {data.sampledRepos[0] && (
                <a href={data.sampledRepos[0].url} target="_blank" rel="noreferrer">
                  Most active: {data.sampledRepos[0].name}
                  <ArrowUpRight aria-hidden="true" size={12} />
                </a>
              )}
            </div>
          </>
        ) : error ? (
          <div className="row-error">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{error}</span>
            <button onClick={retry} type="button">
              <RotateCw aria-hidden="true" size={14} />
              Retry
            </button>
          </div>
        ) : shouldLoad ? (
          <div className="grid-loading">
            <LoaderCircle aria-hidden="true" className="spin" size={18} />
            Loading public activity…
          </div>
        ) : (
          <div className="grid-skeleton" aria-hidden="true">
            {Array.from({ length: 140 }, (_, index) => <i key={index} />)}
          </div>
        )}
      </div>

      <div className="period-controls" aria-label={`Activity period for ${company.name}`}>
        <Link className="deep-dive-link" href={`/company/${company.org}`}>Deep dive</Link>
        <button
          className={period === "rolling" ? "active" : ""}
          onClick={() => setPeriod("rolling")}
          type="button"
        >
          Last 12 months
        </button>
        <button
          className={period === "current" ? "active" : ""}
          onClick={() => setPeriod("current")}
          type="button"
        >
          {currentYear}
        </button>
        <button
          className={period === "previous" ? "active" : ""}
          onClick={() => setPeriod("previous")}
          type="button"
        >
          {currentYear - 1}
        </button>
        {data && (
          <a href={data.githubUrl} target="_blank" rel="noreferrer">
            GitHub
            <ArrowUpRight aria-hidden="true" size={12} />
          </a>
        )}
      </div>
    </article>
  );
}
