"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { formatCompactNumber, formatMomentum } from "@/lib/analytics";
import type { ActivityDay } from "@/lib/types";

const DAY_MS = 86_400_000;
const WEEK_MS = DAY_MS * 7;
const SERIES_COLORS = ["#3fb950", "#58a6ff", "#a371f7"];

type VelocityPoint = {
  label: string;
  title: string;
  total: number;
};

type VelocityResolution = "weeks" | "months";

export type VelocitySeries = {
  activity: ActivityDay[];
  momentum: number;
  name: string;
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

export function VelocityChart({
  ariaLabel,
  series,
}: {
  ariaLabel: string;
  series: VelocitySeries[];
}) {
  const [resolution, setResolution] = useState<VelocityResolution>("weeks");
  const chartSeries = series.map((item) =>
    resolution === "weeks" ? getWeeklyVelocity(item.activity) : getMonthlyVelocity(item.activity),
  );
  const labels = chartSeries[0] ?? [];
  const maximum = Math.max(1, ...chartSeries.flatMap((points) => points.map((point) => point.total)));
  const style = { "--series-count": Math.max(series.length, 1) } as CSSProperties;
  const singleSummary = series[0] ? getVelocitySummary(series[0].activity) : null;

  return (
    <div className={`velocity-chart ${series.length > 1 ? "multi" : "single"}`}>
      <div className="velocity-toolbar">
        {series.length === 1 && singleSummary ? (
          <div className="velocity-summary" aria-label="Velocity summary">
            <span><strong>{formatCompactNumber(singleSummary.week)}</strong><small>/week</small></span>
            <span><strong>{formatCompactNumber(singleSummary.month)}</strong><small>/month</small></span>
            <span><strong>{formatCompactNumber(singleSummary.year)}</strong><small>/year</small></span>
            <span className={series[0].momentum >= 0 ? "positive" : "negative"}>
              <strong>{formatMomentum(series[0].momentum)}</strong><small> acceleration</small>
            </span>
          </div>
        ) : (
        <div className="velocity-legend" aria-label="Chart legend">
          {series.map((item, index) => (
            <span key={item.name}>
              <i style={{ backgroundColor: SERIES_COLORS[index] }} />
              <strong>{item.name}</strong>
              <small>
                {formatCompactNumber(
                  resolution === "weeks"
                    ? getVelocitySummary(item.activity).week
                    : getVelocitySummary(item.activity).month,
                )}/{resolution === "weeks" ? "week" : "month"}
              </small>
              <b className={item.momentum >= 0 ? "positive" : "negative"}>
                {formatMomentum(item.momentum)} acceleration
              </b>
            </span>
          ))}
        </div>
        )}
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
      <div className="velocity-scroll">
        <div
          className={`velocity-plot ${resolution}`}
          role="img"
          aria-label={`${ariaLabel}, grouped by ${resolution}`}
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
                      title={`${item.name}: ${total.toLocaleString()} commits · ${point.title}`}
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
