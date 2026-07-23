import type { CSSProperties } from "react";
import { formatCompactNumber, formatMomentum } from "@/lib/analytics";
import type { ActivityDay } from "@/lib/types";

const DAY_MS = 86_400_000;
const WEEK_MS = DAY_MS * 7;
const SERIES_COLORS = ["#3fb950", "#58a6ff", "#a371f7"];

type VelocityPoint = {
  label: string;
  total: number;
};

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
      total,
    };
  });
}

export function getRecentWeeklyAverage(activity: ActivityDay[]) {
  const weeks = getWeeklyVelocity(activity, 4);
  if (!weeks.length) return 0;
  return Math.round(weeks.reduce((sum, week) => sum + week.total, 0) / weeks.length);
}

export function VelocityChart({
  ariaLabel,
  series,
}: {
  ariaLabel: string;
  series: VelocitySeries[];
}) {
  const weeklySeries = series.map((item) => getWeeklyVelocity(item.activity));
  const labels = weeklySeries[0] ?? [];
  const maximum = Math.max(1, ...weeklySeries.flatMap((weeks) => weeks.map((week) => week.total)));
  const style = { "--series-count": Math.max(series.length, 1) } as CSSProperties;

  return (
    <div className={`velocity-chart ${series.length > 1 ? "multi" : "single"}`}>
      {series.length > 1 && (
        <div className="velocity-legend" aria-label="Chart legend">
          {series.map((item, index) => (
            <span key={item.name}>
              <i style={{ backgroundColor: SERIES_COLORS[index] }} />
              <strong>{item.name}</strong>
              <small>{formatCompactNumber(getRecentWeeklyAverage(item.activity))}/week</small>
              <b className={item.momentum >= 0 ? "positive" : "negative"}>
                {formatMomentum(item.momentum)} momentum
              </b>
            </span>
          ))}
        </div>
      )}
      <div className="velocity-scroll">
        <div className="velocity-plot" role="img" aria-label={ariaLabel} style={style}>
          {labels.map((point, weekIndex) => (
            <div className="velocity-week" key={`${point.label}-${weekIndex}`}>
              <div className="velocity-bars">
                {series.map((item, seriesIndex) => {
                  const total = weeklySeries[seriesIndex]?.[weekIndex]?.total ?? 0;
                  return (
                    <span
                      className={total === 0 ? "empty" : ""}
                      key={item.name}
                      style={{
                        backgroundColor: SERIES_COLORS[seriesIndex],
                        height: `${Math.max(2, (total / maximum) * 100)}%`,
                      }}
                      title={`${item.name}: ${total.toLocaleString()} commits · week of ${point.label}`}
                    />
                  );
                })}
              </div>
              <small>{weekIndex % 2 === 0 || weekIndex === labels.length - 1 ? point.label : ""}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
