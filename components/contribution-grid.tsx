"use client";

import type { ActivityDay } from "@/lib/types";

export type Period = "rolling" | "current" | "previous";

const colors = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - result.getUTCDay());
  return result;
}

function buildWeeks(activity: ActivityDay[], period: Period) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const year = period === "previous" ? today.getUTCFullYear() - 1 : today.getUTCFullYear();
  const end = period === "rolling" ? today : new Date(Date.UTC(year, 11, 31));
  const start =
    period === "rolling"
      ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 364))
      : new Date(Date.UTC(year, 0, 1));

  const firstWeek = startOfWeek(start);
  const byDate = new Map(activity.map((day) => [day.date, day.count]));
  const coverageStart = activity[0] ? new Date(`${activity[0].date}T00:00:00Z`) : today;
  const coverageEnd = activity.at(-1)
    ? new Date(`${activity.at(-1)!.date}T00:00:00Z`)
    : today;
  const weeks: { date: Date; count: number; inRange: boolean }[][] = [];
  const cursor = new Date(firstWeek);

  while (cursor <= end && weeks.length < 53) {
    const week = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(cursor);
      date.setUTCDate(cursor.getUTCDate() + day);
      const dateKey = date.toISOString().slice(0, 10);
      const inRange =
        date >= start &&
        date <= end &&
        date <= today &&
        date >= coverageStart &&
        date <= coverageEnd;
      week.push({ date, count: inRange ? byDate.get(dateKey) ?? 0 : 0, inRange });
    }
    weeks.push(week);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return weeks;
}

function getLevel(count: number, positiveCounts: number[]) {
  if (count <= 0) return 0;
  if (positiveCounts.length < 4) return Math.min(4, count);
  const sorted = [...positiveCounts].sort((a, b) => a - b);
  const threshold = (percentile: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percentile))];
  if (count <= threshold(0.25)) return 1;
  if (count <= threshold(0.5)) return 2;
  if (count <= threshold(0.75)) return 3;
  return 4;
}

export function ContributionGrid({
  activity,
  org,
  period,
}: {
  activity: ActivityDay[];
  org: string;
  period: Period;
}) {
  const weeks = buildWeeks(activity, period);
  const positiveCounts = weeks.flat().map((day) => day.count).filter(Boolean);
  const monthLabels: { label: string; column: number }[] = [];
  let previousMonth = -1;

  weeks.forEach((week, index) => {
    const month = week[0].date.getUTCMonth();
    if (month !== previousMonth && (index === 0 || week[0].date.getUTCDate() <= 7)) {
      monthLabels.push({
        label: week[0].date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
        column: index,
      });
    }
    previousMonth = month;
  });

  return (
    <div className="heatmap-scroll">
      <div className="heatmap" style={{ "--week-count": weeks.length } as React.CSSProperties}>
        <div className="month-labels" aria-hidden="true">
          {monthLabels.map((month, index) => (
            <span key={`${month.label}-${index}`} style={{ gridColumnStart: month.column + 1 }}>
              {month.label}
            </span>
          ))}
        </div>
        <div className="weekday-labels" aria-hidden="true">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div
          className="contribution-cells"
          role="img"
          aria-label={`${org} public commit activity calendar`}
        >
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const level = day.inRange ? getLevel(day.count, positiveCounts) : 0;
              const label = day.date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              });
              return (
                <span
                  className={day.inRange ? "" : "outside-range"}
                  data-count={day.count}
                  key={`${weekIndex}-${dayIndex}`}
                  style={{ backgroundColor: colors[level] }}
                  title={`${day.count.toLocaleString()} commits on ${label}`}
                />
              );
            }),
          )}
        </div>
        <div className="legend" aria-label="Contribution intensity">
          <span>Less</span>
          {colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
