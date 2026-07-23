"use client";

import { Info, LoaderCircle, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityRow } from "@/components/activity-row";
import { categories, type Company } from "@/lib/companies";
import type { LeaderboardSnapshot, OrganizationActivity } from "@/lib/types";

const savedCompaniesKey = "open-office-custom-companies";
const requestCategories = categories.filter((item) => item !== "All");

function parseOrganization(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.hostname === "github.com" || url.hostname === "www.github.com") {
      return url.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
    }
  } catch {
    // Plain GitHub handles are handled below.
  }

  return trimmed.replace(/^@/, "").toLowerCase();
}

export function Directory({
  initialCompanies,
  snapshot,
}: {
  initialCompanies: Company[];
  snapshot: LeaderboardSnapshot;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [customCompanies, setCustomCompanies] = useState<Company[]>([]);
  const [requestValue, setRequestValue] = useState("");
  const [requestCategory, setRequestCategory] =
    useState<(typeof requestCategories)[number]>("Developer tools");
  const [requestError, setRequestError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(savedCompaniesKey) || "[]");
        if (Array.isArray(saved)) setCustomCompanies(saved);
      } catch {
        localStorage.removeItem(savedCompaniesKey);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const snapshotByOrg = useMemo(
    () => new Map(snapshot.entries.map((entry) => [entry.org, entry])),
    [snapshot.entries],
  );

  const companies = useMemo(() => {
    const merged = [...customCompanies, ...initialCompanies].filter(
      (company, index, all) => all.findIndex((item) => item.org === company.org) === index,
    );

    return merged.filter((company) => {
      const matchesCategory = category === "All" || company.category === category;
      const matchesQuery =
        !deferredQuery ||
        company.name.toLowerCase().includes(deferredQuery) ||
        company.org.toLowerCase().includes(deferredQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, customCompanies, deferredQuery, initialCompanies]);

  function openRequest(value = "") {
    setRequestValue(value);
    setRequestError("");
    dialogRef.current?.showModal();
  }

  function closeRequest() {
    if (!requesting) dialogRef.current?.close();
  }

  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    const org = parseOrganization(requestValue);
    const validOrg = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(org);

    if (!validOrg) {
      setRequestError("Enter a GitHub organisation handle or URL.");
      return;
    }

    setRequesting(true);
    setRequestError("");

    try {
      const response = await fetch(`/api/organizations/${encodeURIComponent(org)}`);
      const data = (await response.json()) as OrganizationActivity & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not find that organisation.");

      const company: Company = {
        org,
        name: data.name || org,
        category: requestCategory,
        description: "",
      };
      const saved = [company, ...customCompanies].filter(
        (item, index, all) => all.findIndex((candidate) => candidate.org === item.org) === index,
      );
      setCustomCompanies(saved);
      localStorage.setItem(savedCompaniesKey, JSON.stringify(saved));
      dialogRef.current?.close();
      router.push(`/company/${org}`);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Could not find that organisation.");
    } finally {
      setRequesting(false);
    }
  }

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
            <button className="request-company" type="button" onClick={() => openRequest()}>
              Request a company
            </button>
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
          <span>12-week activity</span>
          <span>Commits</span>
          <span />
        </div>

        {companies.length ? (
          <div className="company-list">
            {companies.map((company, index) => (
              <ActivityRow
                company={company}
                entry={snapshotByOrg.get(company.org)}
                key={company.org}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="directory-empty">
            <p>No companies match “{query.trim()}”.</p>
            <button type="button" onClick={() => openRequest(query.trim())}>
              Request this company
            </button>
          </div>
        )}
      </section>

      <footer id="about">
        <div>
          <Info aria-hidden="true" size={17} />
          <p>
            <strong>Public repositories only.</strong> Activity uses non-merge commits from
            each organisation&apos;s eight most recently active public repositories. It does
            not include private work and is not a measure of company size or productivity.
          </p>
        </div>
        <span>GitHub public data · 52-week window</span>
      </footer>

      <dialog className="request-dialog" ref={dialogRef} onCancel={closeRequest}>
        <form onSubmit={submitRequest}>
          <div className="request-dialog-heading">
            <h2>Request a company</h2>
            <button type="button" onClick={closeRequest} aria-label="Close request form">
              <X aria-hidden="true" size={17} />
            </button>
          </div>
          <label>
            GitHub organisation
            <input
              autoCapitalize="none"
              autoComplete="off"
              autoFocus
              placeholder="github.com/company"
              spellCheck={false}
              value={requestValue}
              onChange={(event) => setRequestValue(event.target.value)}
            />
          </label>
          <label>
            Category
            <select
              value={requestCategory}
              onChange={(event) =>
                setRequestCategory(event.target.value as (typeof requestCategories)[number])
              }
            >
              {requestCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {requestError && <p role="alert">{requestError}</p>}
          <button className="primary-button" disabled={requesting} type="submit">
            {requesting ? (
              <>
                <LoaderCircle aria-hidden="true" className="spin" size={15} />
                Checking GitHub…
              </>
            ) : (
              "Open company"
            )}
          </button>
        </form>
      </dialog>
    </main>
  );
}
