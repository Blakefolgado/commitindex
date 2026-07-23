"use client";

import { ArrowRight, CircleAlert, LoaderCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ContributionGrid } from "@/components/contribution-grid";
import { companies } from "@/lib/companies";
import { calculateOrganizationStats, formatMomentum } from "@/lib/analytics";
import type { OrganizationActivity } from "@/lib/types";

const comparisonMetrics = [
  { label: "Commits", value: (item: OrganizationActivity) => item.totalCommits.toLocaleString() },
  { label: "Active days", value: (item: OrganizationActivity) => item.activeDays.toLocaleString() },
  { label: "Consistency", value: (item: OrganizationActivity) => `${item.stats.consistency}%` },
  { label: "Momentum", value: (item: OrganizationActivity) => formatMomentum(item.stats.momentum) },
  { label: "Weekend", value: (item: OrganizationActivity) => `${item.stats.weekendRatio}%` },
];

export function CompareTool({ initialOrgs }: { initialOrgs: string[] }) {
  const [orgs, setOrgs] = useState(initialOrgs.slice(0, 3));
  const [data, setData] = useState<Record<string, OrganizationActivity>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string[]>(initialOrgs.slice(0, 3));
  const [retryVersion, setRetryVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const available = useMemo(() => companies.filter((company) => !orgs.includes(company.org)), [orgs]);
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return available
      .filter((company) =>
        !normalizedQuery ||
        company.name.toLowerCase().includes(normalizedQuery) ||
        company.org.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [available, query]);
  const loadedItems = orgs
    .map((org) => data[org])
    .filter((item): item is OrganizationActivity => Boolean(item));
  const failedOrgs = orgs.filter((org) => errors[org] && !data[org]);
  const mobileGridStyle = {
    gridTemplateColumns: `88px repeat(${Math.max(loadedItems.length, 1)}, minmax(0, 1fr))`,
  };

  useEffect(() => {
    const controllers = orgs.map((org) => {
      const controller = new AbortController();
      setLoading((current) => current.includes(org) ? current : [...current, org]);
      setErrors((current) => {
        if (!current[org]) return current;
        const next = { ...current };
        delete next[org];
        return next;
      });
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
          if (error.name !== "AbortError") {
            setErrors((current) => ({
              ...current,
              [org]: error instanceof Error ? error.message : "Try again shortly.",
            }));
          }
        })
        .finally(() => setLoading((current) => current.filter((item) => item !== org)));
      return controller;
    });
    const params = new URLSearchParams(window.location.search);
    params.set("orgs", orgs.join(","));
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
    return () => controllers.forEach((controller) => controller?.abort());
  }, [orgs, retryVersion]);

  function add(org: string) {
    if (!org || orgs.length >= 3 || orgs.includes(org)) return;
    setOrgs((current) => [...current, org]);
    setQuery("");
    setPickerOpen(false);
    setActiveIndex(0);
  }

  function remove(org: string) {
    setOrgs((current) => current.filter((item) => item !== org));
    setPickerOpen(false);
  }

  return (
    <main className="compare-shell">
      <div className="page-title">
        <h1>Compare companies</h1>
      </div>

      <div className="compare-picker" aria-label="Companies being compared">
        {orgs.map((org) => {
          const company = companies.find((item) => item.org === org);
          const name = company?.name || org;
          return (
            <button
              aria-label={`Remove ${name} from comparison`}
              type="button"
              onClick={() => remove(org)}
              key={org}
            >
              {name}
              <X aria-hidden="true" size={13} />
            </button>
          );
        })}
        {orgs.length < 3 && (
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
              aria-activedescendant={
                pickerOpen && matches[activeIndex]
                  ? `company-comparison-option-${matches[activeIndex].org}`
                  : undefined
              }
              aria-controls="company-comparison-options"
              aria-expanded={pickerOpen}
              aria-label="Add a company to compare"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="Add company"
              role="combobox"
              spellCheck={false}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPickerOpen(true);
                setActiveIndex(0);
              }}
              onFocus={() => setPickerOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setPickerOpen(false);
                if (event.key === "ArrowDown" && matches.length) {
                  event.preventDefault();
                  setActiveIndex((current) => Math.min(current + 1, matches.length - 1));
                }
                if (event.key === "ArrowUp" && matches.length) {
                  event.preventDefault();
                  setActiveIndex((current) => Math.max(current - 1, 0));
                }
                if (event.key === "Enter" && matches[activeIndex]) {
                  event.preventDefault();
                  add(matches[activeIndex].org);
                }
              }}
            />
            {pickerOpen && (
              <div className="compare-options" id="company-comparison-options" role="listbox">
                {matches.length ? (
                  matches.map((company, index) => (
                    <button
                      aria-selected={activeIndex === index}
                      id={`company-comparison-option-${company.org}`}
                      key={company.org}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => add(company.org)}
                      role="option"
                      type="button"
                    >
                      <strong>{company.name}</strong>
                      <span>{company.org}</span>
                    </button>
                  ))
                ) : (
                  <span>No matching companies</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {failedOrgs.map((org) => {
        const name = companies.find((company) => company.org === org)?.name || org;
        return (
          <div className="compare-error" key={org} role="alert">
            <CircleAlert aria-hidden="true" size={16} />
            <span>
              <strong>{name}</strong> could not load. {errors[org]}
            </span>
            <button type="button" onClick={() => setRetryVersion((current) => current + 1)}>
              Retry
            </button>
          </div>
        );
      })}

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

      {loadedItems.length > 0 && (
        <section className="comparison-mobile-matrix" aria-label="Company comparison metrics">
          <div className="matrix-companies" style={mobileGridStyle}>
            <span aria-hidden="true" />
            {loadedItems.map((item) => (
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
              {loadedItems.map((item) => (
                <strong
                  className={
                    label === "Momentum"
                      ? item.stats.momentum >= 0
                        ? "positive"
                        : "negative"
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
      )}

      <section className="comparison-grids">
        {orgs.map((org) => {
          const item = data[org];
          return item ? (
            <article key={org}>
              <div><h2>{item.name}</h2><Link href={`/company/${org}`}>Deep dive <ArrowRight size={13} /></Link></div>
              <ContributionGrid activity={item.activity} org={item.org} period="rolling" />
            </article>
          ) : null;
        })}
      </section>

      {!orgs.length && <div className="empty-state"><h2>Add a company</h2></div>}
      {loading.length > 0 && <span className="compare-loading-note" role="status">Loading {loading.length} live {loading.length === 1 ? "profile" : "profiles"} from GitHub…</span>}
    </main>
  );
}
