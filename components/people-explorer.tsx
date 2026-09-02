"use client";

import { ArrowUpRight, ChevronDown, LoaderCircle, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { aiReleases, type AiRelease } from "@/data/ai-releases";
import { buildMonthlySeries, type PersonContributionDay, type PersonContributionHistory } from "@/lib/types";

const chartHeight = 360;
const plot = { left: 48, right: 14, top: 84, bottom: 42 };
const maxTooltipReleases = 4;

const providerDomains: Record<string, string> = {
  "Alibaba Qwen": "qwen.ai",
  Anthropic: "anthropic.com",
  Cognition: "cognition.ai",
  "Cognition/Windsurf": "cognition.ai",
  Cursor: "cursor.com",
  DeepSeek: "deepseek.com",
  GitHub: "github.com",
  Google: "google.com",
  Lovable: "lovable.dev",
  Meta: "meta.com",
  Mistral: "mistral.ai",
  OpenAI: "openai.com",
  Replit: "replit.com",
  Vercel: "vercel.com",
  Windsurf: "windsurf.com",
  "Windsurf/Codeium": "windsurf.com",
  xAI: "x.ai",
};

function providerLogoUrl(maker: string) {
  const domain = providerDomains[maker] ?? maker.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

type ChartGesture =
  | { kind: "pan"; startX: number; startY: number; scrollLeft: number }
  | { kind: "pinch"; distance: number; zoom: number; contentRatio: number };

type ChartPointerDrag = {
  pointerId: number;
  scrollLeft: number;
  startX: number;
};

function usernameFromInput(value: string) {
  const trimmed = value.trim().replace(/^@/, "");
  try {
    const url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
    if (url.hostname.toLowerCase() === "github.com") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

function formatReleaseDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonth(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function percentageChange(current: number, previous: number) {
  return previous ? Math.round(((current - previous) / previous) * 100) : null;
}

function summarizeMomentum(contributions: PersonContributionDay[]) {
  const lastDate = new Date(`${contributions.at(-1)!.date}T00:00:00Z`);
  const currentStart = new Date(lastDate);
  currentStart.setUTCDate(currentStart.getUTCDate() - 364);
  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - 364);
  const dateKey = (date: Date) => date.toISOString().slice(0, 10);
  const summarize = (start: string, end: string) => {
    const days = contributions.filter((day) => day.date >= start && day.date <= end);
    const total = days.reduce((sum, day) => sum + day.count, 0);
    const activeDays = days.filter((day) => day.count > 0).length;
    return {
      activeDays,
      average: activeDays ? total / activeDays : 0,
      total,
    };
  };

  return {
    current: summarize(dateKey(currentStart), dateKey(lastDate)),
    previous: summarize(dateKey(previousStart), dateKey(previousEnd)),
  };
}

function WeeklyMomentumChart({
  contributions,
  login,
  releases,
}: {
  contributions: PersonContributionDay[];
  login: string;
  releases: AiRelease[];
}) {
  const [mode, setMode] = useState<"line" | "bars">("line");
  const [containerWidth, setContainerWidth] = useState(1000);
  const [zoom, setZoom] = useState(1);
  const [activeReleaseKey, setActiveReleaseKey] = useState("");
  const [activeMonthStart, setActiveMonthStart] = useState("");
  const [isPointerPanning, setIsPointerPanning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<ChartGesture | null>(null);
  const pointerDragRef = useRef<ChartPointerDrag | null>(null);
  const pendingAnchorRef = useRef<{ contentRatio: number; offset: number } | null>(null);
  const didInitialScrollRef = useRef(false);
  const zoomRef = useRef(1);
  const months = useMemo(() => buildMonthlySeries(contributions), [contributions]);
  const momentum = useMemo(() => summarizeMomentum(contributions), [contributions]);
  const baseChartWidth = Math.max(containerWidth, (months.length / 60) * containerWidth);
  const chartWidth = Math.round(baseChartWidth * zoom);
  const firstMonth = new Date(`${months[0].start}T00:00:00Z`).getTime();
  const lastMonth = new Date(`${months.at(-1)!.start}T00:00:00Z`).getTime();
  const visibleReleases = releases.filter((release) => (
    new Date(`${release.date}T00:00:00Z`).getTime() >= firstMonth
    && new Date(`${release.date}T00:00:00Z`).getTime() <= lastMonth
  ));
  const releaseMarkers = visibleReleases.reduce<Array<{
    date: string;
    key: string;
    releases: AiRelease[];
  }>>((markers, release) => {
    const key = release.date.slice(0, 7);
    const marker = markers.find((candidate) => candidate.key === key);
    if (marker) {
      marker.releases.push(release);
      if (release.date < marker.date) marker.date = release.date;
    } else {
      markers.push({ date: release.date, key, releases: [release] });
    }
    return markers;
  }, []);
  const plotWidth = chartWidth - plot.left - plot.right;
  const plotHeight = chartHeight - plot.top - plot.bottom;
  const maximum = Math.max(...months.map((month) => month.total), 1);
  const tickSize = Math.max(5, Math.ceil(maximum / 4 / 5) * 5);
  const yMaximum = tickSize * 4;
  const x = (index: number) => plot.left + (index / Math.max(months.length - 1, 1)) * plotWidth;
  const y = (value: number) => plot.top + plotHeight - (value / yMaximum) * plotHeight;
  const points = months.map((month, index) => `${x(index)},${y(month.total)}`).join(" ");
  const barWidth = Math.max(2, (plotWidth / Math.max(months.length, 1)) * 0.62);
  const momentumMetrics = [
    {
      change: percentageChange(momentum.current.total, momentum.previous.total),
      label: "Contributions",
      previous: momentum.previous.total.toLocaleString(),
      value: momentum.current.total.toLocaleString(),
    },
    {
      change: percentageChange(momentum.current.activeDays, momentum.previous.activeDays),
      label: "Active days",
      previous: momentum.previous.activeDays.toLocaleString(),
      value: momentum.current.activeDays.toLocaleString(),
    },
    {
      change: percentageChange(momentum.current.average, momentum.previous.average),
      label: "Per active day",
      previous: momentum.previous.average.toLocaleString(undefined, { maximumFractionDigits: 1 }),
      value: momentum.current.average.toLocaleString(undefined, { maximumFractionDigits: 1 }),
    },
  ];
  const releaseX = (date: string) => {
    const ratio = (new Date(`${date}T00:00:00Z`).getTime() - firstMonth) / Math.max(lastMonth - firstMonth, 1);
    return plot.left + ratio * plotWidth;
  };
  const releaseY = (date: string) => {
    const month = months.find((candidate) => candidate.start.slice(0, 7) === date.slice(0, 7));
    return y(month?.total ?? 0);
  };
  const activeReleaseMarker = releaseMarkers.find((marker) => (
    marker.key === activeReleaseKey
  )) ?? null;
  const activeReleaseX = activeReleaseMarker ? releaseX(activeReleaseMarker.date) : 0;
  const releaseTooltipWidth = Math.min(316, chartWidth - plot.left - plot.right);
  const releaseTooltipHeight = activeReleaseMarker
    ? 42
      + Math.min(activeReleaseMarker.releases.length, maxTooltipReleases) * 24
      + (activeReleaseMarker.releases.length > maxTooltipReleases ? 20 : 0)
    : 0;
  const releaseTooltipX = Math.min(
    Math.max(activeReleaseX - releaseTooltipWidth / 2, plot.left + 4),
    chartWidth - plot.right - releaseTooltipWidth,
  );
  const activeMonthIndex = months.findIndex((month) => month.start === activeMonthStart);
  const activeMonth = activeMonthIndex >= 0 ? months[activeMonthIndex] : null;
  const comparisonMonth = activeMonthIndex >= 12 ? months[activeMonthIndex - 12] : null;
  const activeMonthGrowth = activeMonth && comparisonMonth
    ? percentageChange(activeMonth.total, comparisonMonth.total)
    : null;
  const monthTooltipWidth = 208;
  const monthTooltipHeight = 52;
  const activeMonthX = activeMonth ? x(activeMonthIndex) : 0;
  const activeMonthY = activeMonth ? y(activeMonth.total) : 0;
  const monthTooltipX = Math.min(
    Math.max(activeMonthX - monthTooltipWidth / 2, plot.left + 4),
    chartWidth - plot.right - monthTooltipWidth,
  );
  const monthTooltipY = activeMonthY - monthTooltipHeight - 12 < plot.top
    ? activeMonthY + 12
    : activeMonthY - monthTooltipHeight - 12;
  const yearLabels = months
    .map((month, index) => ({
      index,
      label: month.start.slice(0, 4),
      month: month.start.slice(5, 7),
    }))
    .filter((label, index) => label.month === "01" || index === 0);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(Math.max(320, entries[0].contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (!didInitialScrollRef.current && node.scrollWidth > node.clientWidth) {
      node.scrollLeft = node.scrollWidth - node.clientWidth;
      didInitialScrollRef.current = true;
    }
    const anchor = pendingAnchorRef.current;
    if (anchor) {
      node.scrollLeft = anchor.contentRatio * node.scrollWidth - anchor.offset;
      pendingAnchorRef.current = null;
    }
  }, [chartWidth]);

  function setAnchoredZoom(nextZoom: number, contentRatio: number, offset: number) {
    const boundedZoom = Math.min(3, Math.max(0.6, nextZoom));
    if (Math.abs(boundedZoom - zoomRef.current) < 0.001) return;
    pendingAnchorRef.current = { contentRatio, offset };
    zoomRef.current = boundedZoom;
    setZoom(boundedZoom);
  }

  function zoomFromCenter(factor: number) {
    const node = scrollRef.current;
    if (!node) return;
    const offset = node.clientWidth / 2;
    const contentRatio = (node.scrollLeft + offset) / Math.max(node.scrollWidth, 1);
    setAnchoredZoom(zoomRef.current * factor, contentRatio, offset);
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey) return;
    const node = scrollRef.current;
    if (!node) return;
    event.preventDefault();
    const offset = event.clientX - node.getBoundingClientRect().left;
    const contentRatio = (node.scrollLeft + offset) / Math.max(node.scrollWidth, 1);
    const factor = Math.min(1.25, Math.max(0.8, Math.exp(-event.deltaY * 0.01)));
    setAnchoredZoom(zoomRef.current * factor, contentRatio, offset);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || event.button !== 0) return;
    const node = scrollRef.current;
    if (!node || (event.target as Element).closest(".people-release-link")) return;
    event.preventDefault();
    node.setPointerCapture(event.pointerId);
    pointerDragRef.current = {
      pointerId: event.pointerId,
      scrollLeft: node.scrollLeft,
      startX: event.clientX,
    };
    setIsPointerPanning(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const node = scrollRef.current;
    const drag = pointerDragRef.current;
    if (!node || !drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    node.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const node = scrollRef.current;
    const drag = pointerDragRef.current;
    if (!node || !drag || drag.pointerId !== event.pointerId) return;
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
    pointerDragRef.current = null;
    setIsPointerPanning(false);
  }

  function touchDistance(event: TouchEvent<HTMLDivElement>) {
    const [first, second] = [event.touches[0], event.touches[1]];
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const node = scrollRef.current;
    if (!node) return;
    if (event.touches.length === 2) {
      const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2
        - node.getBoundingClientRect().left;
      gestureRef.current = {
        kind: "pinch",
        distance: touchDistance(event),
        zoom,
        contentRatio: (node.scrollLeft + centerX) / Math.max(node.scrollWidth, 1),
      };
    } else if (event.touches.length === 1) {
      gestureRef.current = {
        kind: "pan",
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
        scrollLeft: node.scrollLeft,
      };
    }
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const node = scrollRef.current;
    const gesture = gestureRef.current;
    if (!node || !gesture) return;
    if (gesture.kind === "pinch" && event.touches.length === 2) {
      event.preventDefault();
      const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2
        - node.getBoundingClientRect().left;
      setAnchoredZoom(
        gesture.zoom * (touchDistance(event) / Math.max(gesture.distance, 1)),
        gesture.contentRatio,
        centerX,
      );
    } else if (gesture.kind === "pan" && event.touches.length === 1) {
      const deltaX = event.touches[0].clientX - gesture.startX;
      const deltaY = event.touches[0].clientY - gesture.startY;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
        node.scrollLeft = gesture.scrollLeft - deltaX;
      }
    }
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const node = scrollRef.current;
    if (event.touches.length === 1 && node) {
      gestureRef.current = {
        kind: "pan",
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
        scrollLeft: node.scrollLeft,
      };
    } else {
      gestureRef.current = null;
    }
  }

  return (
    <>
      <div className="people-chart-toolbar">
        <div className="people-chart-title">
          <h2 id="people-graph-heading">Momentum</h2>
        </div>
        <div className="people-chart-actions">
          <div className="people-chart-zoom" aria-label="Chart zoom">
            <button aria-label="Zoom out" onClick={() => zoomFromCenter(0.8)} type="button">−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button aria-label="Zoom in" onClick={() => zoomFromCenter(1.25)} type="button">+</button>
          </div>
          <div className="people-chart-mode" aria-label="Chart style">
            <button aria-pressed={mode === "line"} className={mode === "line" ? "active" : ""} onClick={() => setMode("line")} type="button">Line</button>
            <button aria-pressed={mode === "bars"} className={mode === "bars" ? "active" : ""} onClick={() => setMode("bars")} type="button">Bars</button>
          </div>
        </div>
      </div>
      <dl className="people-momentum-metrics">
        {momentumMetrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>
              <strong>{metric.value}</strong>
              {metric.change !== null && (
                <span className={metric.change >= 0 ? "positive" : "negative"}>
                  {metric.change > 0 ? "+" : ""}{metric.change}%
                </span>
              )}
            </dd>
            <small>{metric.previous} prior</small>
          </div>
        ))}
      </dl>
      <div
        className={`people-chart-scroll${isPointerPanning ? " is-panning" : ""}`}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onTouchCancel={handleTouchEnd}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        ref={scrollRef}
      >
        <svg
          aria-label={`${login} all-time monthly public GitHub contribution momentum, shown as a ${mode} chart`}
          className="people-momentum-chart"
          role="img"
          style={{ height: chartHeight, width: chartWidth }}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <title>{login} all-time monthly public GitHub contribution momentum</title>
          {Array.from({ length: 5 }, (_, index) => {
            const value = tickSize * index;
            const tickY = y(value);
            return (
              <g className="people-y-tick" key={value}>
                <line x1={plot.left} x2={chartWidth - plot.right} y1={tickY} y2={tickY} />
                <text x={plot.left - 10} y={tickY + 4}>{value}</text>
              </g>
            );
          })}
          {mode === "bars" ? months.map((month, index) => (
            <rect
              className="people-momentum-bar"
              height={Math.max(1, chartHeight - plot.bottom - y(month.total))}
              key={month.start}
              onPointerEnter={() => setActiveMonthStart(month.start)}
              onPointerLeave={() => setActiveMonthStart("")}
              rx="2"
              width={barWidth}
              x={x(index) - barWidth / 2}
              y={y(month.total)}
            >
              <title>{month.total.toLocaleString()} contributions in {formatMonth(month.start)}</title>
            </rect>
          )) : (
            <>
              <polyline className="people-momentum-line" points={points} />
              {months.map((month, index) => (
                <g
                  className="people-momentum-hover"
                  key={month.start}
                  onPointerEnter={() => setActiveMonthStart(month.start)}
                  onPointerLeave={() => setActiveMonthStart("")}
                >
                  <circle className="people-momentum-hit-target" cx={x(index)} cy={y(month.total)} r="9" />
                  <circle className="people-momentum-point" cx={x(index)} cy={y(month.total)} r="2.5">
                    <title>{month.total.toLocaleString()} contributions in {formatMonth(month.start)}</title>
                  </circle>
                </g>
              ))}
            </>
          )}
          {releaseMarkers.map((marker) => {
            const markerX = releaseX(marker.date);
            const markerY = releaseY(marker.date);
            const markerLabel = marker.releases
              .map((release) => `${release.name}, ${formatReleaseDate(release.date)}`)
              .join("; ");
            return (
              <a
                aria-label={markerLabel}
                className="people-release-link"
                href={marker.releases[0].url}
                key={marker.key}
                onBlur={() => setActiveReleaseKey("")}
                onFocus={() => setActiveReleaseKey(marker.key)}
                onPointerEnter={() => setActiveReleaseKey(marker.key)}
                onPointerLeave={() => setActiveReleaseKey("")}
                rel="noreferrer"
                target="_blank"
              >
                <g className="people-release-marker">
                  <rect className="people-release-hit-target" height="26" width="22" x={markerX - 11} y={markerY - 13} />
                  <circle cx={markerX} cy={markerY} r="4" />
                </g>
              </a>
            );
          })}
          <line className="people-x-axis" x1={plot.left} x2={chartWidth - plot.right} y1={chartHeight - plot.bottom} y2={chartHeight - plot.bottom} />
          {yearLabels.map((label) => <text className="people-month-label" key={`${label.label}-${label.index}`} textAnchor="middle" x={x(label.index)} y={chartHeight - 15}>{label.label}</text>)}
          {activeMonth && !activeReleaseMarker && (
            <foreignObject
              aria-hidden="true"
              className="people-month-tooltip"
              height={monthTooltipHeight}
              width={monthTooltipWidth}
              x={monthTooltipX}
              y={monthTooltipY}
            >
              <div className="people-month-tooltip-card">
                <span>{formatMonth(activeMonth.start)}</span>
                <strong>{activeMonth.total.toLocaleString()} contributions</strong>
                {activeMonthGrowth !== null && (
                  <small className={activeMonthGrowth >= 0 ? "positive" : "negative"}>
                    {activeMonthGrowth > 0 ? "+" : ""}{activeMonthGrowth}% vs last year
                  </small>
                )}
              </div>
            </foreignObject>
          )}
          {activeReleaseMarker && (
            <foreignObject
              aria-hidden="true"
              className="people-release-tooltip"
              height={releaseTooltipHeight}
              width={releaseTooltipWidth}
              x={releaseTooltipX}
              y="8"
            >
              <div className="people-release-tooltip-card">
                <div className="people-release-tooltip-heading">
                  <strong>{formatMonth(`${activeReleaseMarker.key}-01`)}</strong>
                  <span>{activeReleaseMarker.releases.length} release{activeReleaseMarker.releases.length === 1 ? "" : "s"}</span>
                </div>
                {activeReleaseMarker.releases.slice(0, maxTooltipReleases).map((release) => (
                  <div
                    className="people-release-tooltip-row"
                    key={`${release.date}-${release.name}`}
                  >
                    <span className="people-release-logo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" height="14" src={providerLogoUrl(release.maker)} width="14" />
                    </span>
                    <time>{formatReleaseDate(release.date).replace(` ${release.date.slice(0, 4)}`, "")}</time>
                    <strong>{release.name}</strong>
                  </div>
                ))}
                {activeReleaseMarker.releases.length > maxTooltipReleases && (
                  <div className="people-release-tooltip-more">
                    +{activeReleaseMarker.releases.length - maxTooltipReleases} more in the release index
                  </div>
                )}
              </div>
            </foreignObject>
          )}
        </svg>
      </div>
    </>
  );
}

export function PeopleExplorer({
  initialUsername,
  leaderboard,
}: {
  initialUsername: string;
  /** Server-rendered leaderboard, placed inline so it stays reachable. */
  leaderboard?: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The URL is the source of truth: a client-side navigation (a leaderboard row,
  // the back button) changes the param without remounting this component.
  const urlUsername = searchParams.get("user")?.trim().replace(/^@/, "") ?? initialUsername;
  const [input, setInput] = useState(initialUsername ? `github.com/${initialUsername}` : "");
  const [username, setUsername] = useState(initialUsername);
  const [data, setData] = useState<PersonContributionHistory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(initialUsername));
  const [requestKey, setRequestKey] = useState(0);
  const releases = aiReleases;

  useEffect(() => {
    if (urlUsername === username) return;
    setUsername(urlUsername);
    setInput(urlUsername ? `github.com/${urlUsername}` : "");
    setError("");
    setLoading(Boolean(urlUsername));
    if (!urlUsername) setData(null);
  }, [urlUsername, username]);

  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    fetch(`/api/github-people/${encodeURIComponent(username)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load this GitHub profile");
        return payload as PersonContributionHistory;
      })
      .then((payload) => setData(payload))
      .catch((caught: Error) => {
        if (caught.name !== "AbortError") {
          setData(null);
          setError(caught.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requestKey, username]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUsername = usernameFromInput(input);
    if (!nextUsername) {
      setError("Enter a GitHub username or profile URL");
      return;
    }
    setLoading(true);
    setError("");
    setUsername(nextUsername);
    setInput(`github.com/${nextUsername}`);
    setRequestKey((value) => value + 1);
    // push, not replace, so the back button returns to whatever came before.
    router.push(`/people?user=${encodeURIComponent(nextUsername)}`, { scroll: false });
  }

  return (
    <main className="people-shell">
      <header className="people-intro">
        <h1>GitHub momentum</h1>
      </header>

      <form className="people-search" onSubmit={submit}>
        <label>
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">GitHub username or profile URL</span>
          <input
            autoCapitalize="none"
            autoComplete="off"
            onChange={(event) => setInput(event.target.value)}
            placeholder="github.com/username"
            spellCheck={false}
            value={input}
          />
        </label>
        <button className="primary-button" disabled={loading} type="submit">Search</button>
      </form>

      {loading && (
        <div className="people-explorer-status" role="status">
          <LoaderCircle className="spin" aria-hidden="true" size={18} />
          Loading public GitHub activity…
        </div>
      )}
      {!loading && error && <div className="people-explorer-status error" role="alert">{error}</div>}

      {!loading && !data && leaderboard}

      {!loading && data && (
        <>
          <section className="people-profile-summary" aria-label={`${data.name} contribution summary`}>
            <a href={data.githubUrl} target="_blank" rel="noreferrer" className="people-profile-identity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.avatarUrl} alt="" width={58} height={58} />
              <span><strong>{data.name}</strong><small>@{data.login}</small></span>
              <ArrowUpRight aria-hidden="true" size={14} />
            </a>
          </section>

          <section className="people-graph-panel" aria-labelledby="people-graph-heading">
            <WeeklyMomentumChart
              contributions={data.contributions}
              login={data.login}
              releases={releases}
            />
          </section>

          {leaderboard}

          <details className="people-release-list" open>
            <summary>
              <strong>AI release index</strong>
              <span>{releases.length} releases</span>
              <ChevronDown aria-hidden="true" size={15} />
            </summary>
            {releases.length ? (
              <div role="list">
                <div className="people-release-header" aria-hidden="true"><span>Date</span><span>Release</span><span>Maker</span><span>Category</span><span /></div>
                {releases.map((release) => (
                  <a href={release.url} key={`${release.date}-${release.name}`} rel="noreferrer" role="listitem" target="_blank">
                    <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
                    <strong>{release.name}</strong>
                    <span className="people-release-maker">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" height="14" src={providerLogoUrl(release.maker)} width="14" />
                      {release.maker}
                    </span>
                    <span>{release.category}</span>
                    <ArrowUpRight aria-hidden="true" size={13} />
                  </a>
                ))}
              </div>
            ) : <p className="people-no-releases">No major releases are indexed for this year yet.</p>}
          </details>
        </>
      )}
    </main>
  );
}
