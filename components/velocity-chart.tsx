"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { formatCompactNumber, formatMomentum } from "@/lib/analytics";
import type { ActivityDay, CodeFrequencyWeek } from "@/lib/types";

const DAY_MS = 86_400_000;
const WEEK_MS = DAY_MS * 7;
const SERIES_COLORS = ["#3fb950", "#58a6ff", "#a371f7"];

type VelocityPoint = {
  additions?: number;
  deletions?: number;
  label: string;
  title: string;
  total: number;
};

type VelocityMetric = "commits" | "lines";
type VelocityResolution = "weeks" | "months";

export type VelocitySeries = {
  activity: ActivityDay[];
  codeFrequency: CodeFrequencyWeek[];
  codeFrequencyRepos: number;
  momentum: number;
  name: string;
  sampledRepositories: number;
};

function toUtcDay(value: string) {
  return new Date(`${value}T00:00:00Z`).getTime();
}

export function getWeeklyVelocity(activity: ActivityDay[], weekCount = 12): VelocityPoint[] {
  const available = activity
    .filter((day) => Number.isFinite(day.count) && Number.isFinite(toUtcDay(day.date)))
    .sort((left, right) => left.date.localeCompare(right.date));
  const latest = available.at(-1);

  if (!latest) return [];

  const end = toUtcDay(latest.date);
  const start = end - (weekCount * WEEK_MS) + DAY_MS;
  const totals = Array.from({ length: weekCount }, () => 0);

  for (const day of available) {
    const timestamp = toUtcDay(day.date);
    const index = Math.floor((timestamp - start) / WEEK_MS);
    if (index >= 0 && index < weekCount) totals[index] += day.count;
  }

  return totals.map((total, index) => {
    const weekStart = new Date(start + index * WEEK_MS);
    return {
      label: weekStart.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      title: `week of ${weekStart.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })}`,
      total,
    };
  });
}

export function getMonthlyVelocity(activity: ActivityDay[], monthCount = 12): VelocityPoint[] {
  const available = activity
    .filter((day) => Number.isFinite(day.count) && Number.isFinite(toUtcDay(day.date)))
    .sort((left, right) => left.date.localeCompare(right.date));
  const latest = available.at(-1);

  if (!latest) return [];

  const latestDate = new Date(`${latest.date}T00:00:00Z`);
  const months = Array.from({ length: monthCount }, (_, index) => {
    const month = new Date(Date.UTC(
      latestDate.getUTCFullYear(),
      latestDate.getUTCMonth() - (monthCount - 1 - index),
      1,
    ));
    return {
      key: month.toISOString().slice(0, 7),
      label: month.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      title: month.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      total: 0,
    };
  });
  const byMonth = new Map(months.map((month) => [month.key, month]));

  for (const day of available) {
    const month = byMonth.get(day.date.slice(0, 7));
    if (month) month.total += day.count;
  }

  return months.map(({ label, title, total }) => ({ label, title, total }));
}

function getWeeklyLineVelocity(
  codeFrequency: CodeFrequencyWeek[],
  weekCount = 12,
): VelocityPoint[] {
  const available = codeFrequency
    .filter((week) =>
      Number.isFinite(week.week) &&
      Number.isFinite(week.additions) &&
      Number.isFinite(week.deletions),
    )
    .sort((left, right) => left.week - right.week);
  const latest = available.at(-1);

  if (!latest) return [];

  const latestWeek = latest.week * 1000;
  const start = latestWeek - (weekCount - 1) * WEEK_MS;
  const totals = Array.from(
    { length: weekCount },
    () => ({ additions: 0, deletions: 0 }),
  );

  for (const week of available) {
    const index = Math.round((week.week * 1000 - start) / WEEK_MS);
    if (index < 0 || index >= weekCount) continue;
    totals[index].additions += week.additions;
    totals[index].deletions += week.deletions;
  }

  return totals.map(({ additions, deletions }, index) => {
    const weekStart = new Date(start + index * WEEK_MS);
    return {
      additions,
      deletions,
      label: weekStart.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      title: `week of ${weekStart.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })}`,
      total: additions + deletions,
    };
  });
}

function getMonthlyLineVelocity(
  codeFrequency: CodeFrequencyWeek[],
  monthCount = 12,
): VelocityPoint[] {
  const available = codeFrequency
    .filter((week) =>
      Number.isFinite(week.week) &&
      Number.isFinite(week.additions) &&
      Number.isFinite(week.deletions),
    )
    .sort((left, right) => left.week - right.week);
  const latest = available.at(-1);

  if (!latest) return [];

  const latestDate = new Date(latest.week * 1000);
  const months = Array.from({ length: monthCount }, (_, index) => {
    const month = new Date(Date.UTC(
      latestDate.getUTCFullYear(),
      latestDate.getUTCMonth() - (monthCount - 1 - index),
      1,
    ));
    return {
      additions: 0,
      deletions: 0,
      key: month.toISOString().slice(0, 7),
      label: month.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      title: month.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  });
  const byMonth = new Map(months.map((month) => [month.key, month]));

  for (const week of available) {
    const month = byMonth.get(new Date(week.week * 1000).toISOString().slice(0, 7));
    if (!month) continue;
    month.additions += week.additions;
    month.deletions += week.deletions;
  }

  return months.map(({ additions, deletions, label, title }) => ({
    additions,
    deletions,
    label,
    title,
    total: additions + deletions,
  }));
}

function getTrailingTotal(activity: ActivityDay[], dayCount: number) {
  return activity
    .filter((day) => Number.isFinite(day.count))
    .slice(-dayCount)
    .reduce((sum, day) => sum + day.count, 0);
}

export function getRecentWeeklyAverage(activity: ActivityDay[]) {
  const weeks = getWeeklyVelocity(activity, 4);
  if (!weeks.length) return 0;
  return Math.round(weeks.reduce((sum, week) => sum + week.total, 0) / weeks.length);
}

export function getVelocitySummary(activity: ActivityDay[]) {
  return {
    month: getTrailingTotal(activity, 30),
    week: getRecentWeeklyAverage(activity),
    year: getTrailingTotal(activity, 365),
  };
}

function getLineVelocitySummary(codeFrequency: CodeFrequencyWeek[]) {
  const weeks = getWeeklyLineVelocity(codeFrequency, 52);
  const recent = weeks.slice(-4).reduce((sum, week) => sum + week.total, 0);
  const previous = weeks.slice(-8, -4).reduce((sum, week) => sum + week.total, 0);

  return {
    acceleration: previous === 0
      ? recent > 0 ? 100 : 0
      : Math.round(((recent - previous) / previous) * 100),
    month: recent,
    week: Math.round(recent / Math.max(weeks.slice(-4).length, 1)),
    year: weeks.reduce((sum, week) => sum + week.total, 0),
  };
}

export function VelocityChart({
  ariaLabel,
  series,
}: {
  ariaLabel: string;
  series: VelocitySeries[];
}) {
  const [metric, setMetric] = useState<VelocityMetric>("commits");
  const [resolution, setResolution] = useState<VelocityResolution>("weeks");
  const hasLineData = series.some((item) => item.codeFrequency.length > 0);
  const chartSeries = series.map((item) => {
    if (metric === "lines") {
      return resolution === "weeks"
        ? getWeeklyLineVelocity(item.codeFrequency)
        : getMonthlyLineVelocity(item.codeFrequency);
    }
    return resolution === "weeks"
      ? getWeeklyVelocity(item.activity)
      : getMonthlyVelocity(item.activity);
  });
  const labels = chartSeries.find((points) => points.length > 0) ?? [];
  const maximum = Math.max(1, ...chartSeries.flatMap((points) => points.map((point) => point.total)));
  const style = { "--series-count": Math.max(series.length, 1) } as CSSProperties;
  const summaries = series.map((item) =>
    metric === "commits"
      ? { ...getVelocitySummary(item.activity), acceleration: item.momentum }
      : getLineVelocitySummary(item.codeFrequency),
  );
  const singleSummary = summaries[0] ?? null;
  const unit = metric === "commits" ? "commits" : "lines changed";
  const lineCoverage = series.length === 1
    ? `${series[0].codeFrequencyRepos} of ${series[0].sampledRepositories} sampled repositories provide line data`
    : "Line totals include GitHub-supported sampled repositories";

  return (
    <div className={`velocity-chart ${series.length > 1 ? "multi" : "single"}`}>
      <div className="velocity-toolbar">
        {series.length === 1 && singleSummary ? (
          <div className="velocity-summary" aria-label="Velocity summary">
            <span><strong>{formatCompactNumber(singleSummary.week)}</strong><small>/week</small></span>
            <span><strong>{formatCompactNumber(singleSummary.month)}</strong><small>/month</small></span>
            <span><strong>{formatCompactNumber(singleSummary.year)}</strong><small>/year</small></span>
            <span className={singleSummary.acceleration >= 0 ? "positive" : "negative"}>
              <strong>{formatMomentum(singleSummary.acceleration)}</strong><small> acceleration</small>
            </span>
          </div>
        ) : (
        <div className="velocity-legend" aria-label="Chart legend">
          {series.map((item, index) => (
            <span key={item.name}>
              <i style={{ backgroundColor: SERIES_COLORS[index] }} />
              <strong>{item.name}</strong>
              <small>
                {item.codeFrequency.length === 0 && metric === "lines"
                  ? "Unavailable"
                  : `${formatCompactNumber(
                    resolution === "weeks"
                      ? summaries[index].week
                      : summaries[index].month,
                  )}/${resolution === "weeks" ? "week" : "month"}`}
              </small>
              {(metric === "commits" || item.codeFrequency.length > 0) && (
                <b className={summaries[index].acceleration >= 0 ? "positive" : "negative"}>
                  {formatMomentum(summaries[index].acceleration)} acceleration
                </b>
              )}
            </span>
          ))}
        </div>
        )}
        <div className="velocity-controls">
          <div className="velocity-resolution" role="group" aria-label="Chart metric">
            {(["commits", "lines"] as const).map((value) => (
              <button
                aria-pressed={metric === value}
                className={metric === value ? "active" : ""}
                disabled={value === "lines" && !hasLineData}
                key={value}
                onClick={() => setMetric(value)}
                title={value === "lines" ? lineCoverage : undefined}
                type="button"
              >
                {value === "commits" ? "Commits" : "Lines"}
              </button>
            ))}
          </div>
          <div className="velocity-resolution" role="group" aria-label="Chart interval">
            {(["weeks", "months"] as const).map((value) => (
              <button
                aria-pressed={resolution === value}
                className={resolution === value ? "active" : ""}
                key={value}
                onClick={() => setResolution(value)}
                type="button"
              >
                {value === "weeks" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="velocity-scroll">
        <div
          className={`velocity-plot ${resolution}`}
          role="img"
          aria-label={`${ariaLabel}, ${unit}, grouped by ${resolution}`}
          style={style}
        >
          {labels.map((point, weekIndex) => (
            <div className="velocity-week" key={`${point.label}-${weekIndex}`}>
              <div className="velocity-bars">
                {series.map((item, seriesIndex) => {
                  const total = chartSeries[seriesIndex]?.[weekIndex]?.total ?? 0;
                  return (
                    <span
                      className={total === 0 ? "empty" : ""}
                      key={item.name}
                      style={{
                        backgroundColor: SERIES_COLORS[seriesIndex],
                        height: `${Math.max(2, (total / maximum) * 100)}%`,
                      }}
                      title={
                        metric === "lines"
                          ? `${item.name}: ${total.toLocaleString()} lines changed (+${(point.additions ?? 0).toLocaleString()} / -${(point.deletions ?? 0).toLocaleString()}) · ${point.title}`
                          : `${item.name}: ${total.toLocaleString()} commits · ${point.title}`
                      }
                    />
                  );
                })}
              </div>
              <small>
                {resolution === "months" || weekIndex % 2 === 0 || weekIndex === labels.length - 1
                  ? point.label
                  : ""}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
