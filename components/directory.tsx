"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import {
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { ActivityRow } from "@/components/activity-row";
import { categories, type Company } from "@/lib/companies";
import type { DirectoryEntry } from "@/lib/types";

const requestUrl = "https://github.com/Blakefolgado/open-office/issues/new?template=company-request.yml";

export function Directory({
  entries,
  initialCompanies,
}: {
  entries: DirectoryEntry[];
  initialCompanies: Company[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const entriesByOrg = useMemo(
    () => new Map(entries.map((entry) => [entry.org, entry])),
    [entries],
  );

  const companies = useMemo(() => {
    return initialCompanies.filter((company) => {
      const matchesCategory = category === "All" || company.category === category;
      const matchesQuery =
        !deferredQuery ||
        company.name.toLowerCase().includes(deferredQuery) ||
        company.org.toLowerCase().includes(deferredQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, deferredQuery, initialCompanies]);

  return (
    <main>
      <section className="directory-shell" aria-label="Company GitHub activity directory">
        <div className="directory-intro">
          <h1>Companies</h1>
          <div className="directory-search-row">
            <form className="search-form" onSubmit={(event) => event.preventDefault()}>
              <Search aria-hidden="true" size={16} />
              <input
                aria-label="Search companies or GitHub organisations"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search companies or GitHub organisations"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button className="clear-search" type="button" onClick={() => setQuery("")}>
                  <X aria-hidden="true" size={15} />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </form>
            <div className="directory-actions">
              <Link href="/compare">Compare companies</Link>
              <a className="request-company" href={requestUrl} target="_blank" rel="noreferrer">
                Request a company
              </a>
            </div>
          </div>
        </div>

        <nav className="category-nav" aria-label="Company categories">
          {categories.map((item) => (
            <button
              className={category === item ? "active" : ""}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="directory-list-header" aria-hidden="true">
          <span>#</span>
          <span>Company</span>
          <span className="directory-commits-header">
            <span>Commits</span>
            <small>30d</small>
            <small>6mo</small>
            <small>12mo</small>
          </span>
          <span>12-week trend</span>
          <span />
        </div>

        {companies.length ? (
          <div className="company-list">
            {companies.map((company, index) => (
              <ActivityRow
                company={company}
                entry={entriesByOrg.get(company.org)}
                key={company.org}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="directory-empty">
            <p>No companies match “{query.trim()}”.</p>
            <a
              href={`${requestUrl}&title=${encodeURIComponent(`Add company: ${query.trim()}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Request this company
            </a>
          </div>
        )}
      </section>

      <footer id="about">
        <details>
          <summary>Methodology</summary>
          <p>
            Public non-merge commits from eight recently active repositories. Private work
            is excluded; totals are not productivity scores.
          </p>
        </details>
        <span>GitHub · Updated daily</span>
      </footer>
    </main>
  );
}
