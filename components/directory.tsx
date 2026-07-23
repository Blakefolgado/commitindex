"use client";

import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  Github,
  Info,
  Search,
  X,
} from "lucide-react";
import { FormEvent, useDeferredValue, useMemo, useState } from "react";
import { ActivityRow } from "@/components/activity-row";
import { categories, type Company } from "@/lib/companies";

type SortMode = "featured" | "name";

export function Directory({ initialCompanies }: { initialCompanies: Company[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [sort, setSort] = useState<SortMode>("featured");
  const [customCompanies, setCustomCompanies] = useState<Company[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const companies = useMemo(() => {
    const merged = [...customCompanies, ...initialCompanies].filter(
      (company, index, all) => all.findIndex((item) => item.org === company.org) === index,
    );
    const filtered = merged.filter((company) => {
      const matchesCategory = category === "All" || company.category === category;
      const matchesQuery =
        !deferredQuery ||
        company.name.toLowerCase().includes(deferredQuery) ||
        company.org.toLowerCase().includes(deferredQuery) ||
        company.description.toLowerCase().includes(deferredQuery);
      return matchesCategory && matchesQuery;
    });
    return sort === "name"
      ? filtered.toSorted((a, b) => a.name.localeCompare(b.name))
      : filtered;
  }, [category, customCompanies, deferredQuery, initialCompanies, sort]);

  const exactMatch = [...initialCompanies, ...customCompanies].some(
    (company) => company.org.toLowerCase() === deferredQuery,
  );
  const validCustomOrg = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(deferredQuery);

  function addCustomCompany(event?: FormEvent) {
    event?.preventDefault();
    if (!deferredQuery || exactMatch || !validCustomOrg) return;
    setCustomCompanies((current) => [
      {
        org: deferredQuery,
        name: deferredQuery,
        category: "Featured",
        description: "Public GitHub organisation",
      },
      ...current,
    ]);
    setCategory("All");
    setVisibleCount((count) => Math.max(count, 12));
  }

  return (
    <main>
      <section className="directory-shell" aria-label="Company GitHub activity directory">
        <div className="directory-intro">
          <div>
            <h1>How companies ship in public.</h1>
            <p>Explore the GitHub activity behind 85 of technology&apos;s most interesting organisations.</p>
          </div>
          <form className="search-form" onSubmit={addCustomCompany}>
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search a GitHub organisation"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search a company or GitHub organisation"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(12);
              }}
            />
            {query && (
              <button className="clear-search" type="button" onClick={() => setQuery("")}>
                <X aria-hidden="true" size={16} />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </form>
        </div>
        <nav className="category-nav" aria-label="Company categories">
          {categories.map((item) => (
            <button
              className={category === item ? "active" : ""}
              key={item}
              onClick={() => {
                setCategory(item);
                setVisibleCount(12);
              }}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="directory-tools">
          <span>
            {companies.length} {companies.length === 1 ? "organisation" : "organisations"}
          </span>
          <a
            className="github-source"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            <Github aria-hidden="true" size={15} />
            Public activity from GitHub
            <ArrowUpRight aria-hidden="true" size={12} />
          </a>
          <label className="sort-control">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              <option value="featured">Featured</option>
              <option value="name">Name A–Z</option>
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>
        </div>

        {companies.length > 0 ? (
          <div className="company-list">
            {companies.slice(0, visibleCount).map((company, index) => (
              <ActivityRow company={company} eager={index < 4} key={company.org} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Building2 aria-hidden="true" size={25} />
            <h2>No curated company matches “{query.trim()}”</h2>
            {validCustomOrg ? (
              <>
                <p>Try it as a public GitHub organisation.</p>
                <button type="button" onClick={() => addCustomCompany()}>
                  Explore github.com/{deferredQuery}
                </button>
              </>
            ) : (
              <p>Search by company name or enter an exact GitHub organisation handle.</p>
            )}
          </div>
        )}

        {companies.length > visibleCount && (
          <button className="load-more" type="button" onClick={() => setVisibleCount((n) => n + 12)}>
            Show 12 more companies
          </button>
        )}
      </section>

      <footer id="about">
        <div>
          <Info aria-hidden="true" size={17} />
          <p>
            <strong>Public repositories only.</strong> Each grid sums non-merge commits
            reported by GitHub across the organisation&apos;s eight most recently active
            public repositories. It does not include private work and is not a measure of
            company size or productivity.
          </p>
        </div>
        <span>Updated daily · 52-week GitHub API window</span>
      </footer>
    </main>
  );
}
