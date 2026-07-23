import type { ActivityDay, OrganizationStats } from "@/lib/types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function calculateOrganizationStats(activity: ActivityDay[]): OrganizationStats {
  const available = activity.filter((day) => Number.isFinite(day.count));
  const active = available.filter((day) => day.count > 0);
  const weekdayTotals = Array.from({ length: 7 }, () => 0);
  let weekendCommits = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  for (const day of available) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    weekdayTotals[weekday] += day.count;
    if (weekday === 0 || weekday === 6) weekendCommits += day.count;
    if (day.count > 0) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  let currentStreak = 0;
  for (let index = available.length - 1; index >= 0 && available[index].count > 0; index -= 1) {
    currentStreak += 1;
  }

  const totalCommits = available.reduce((sum, day) => sum + day.count, 0);
  const recent = available.slice(-30).reduce((sum, day) => sum + day.count, 0);
  const previous = available.slice(-60, -30).reduce((sum, day) => sum + day.count, 0);
  const momentum = previous === 0
    ? recent > 0 ? 100 : 0
    : Math.round(((recent - previous) / previous) * 100);
  const peakDay = available.reduce<ActivityDay>(
    (peak, day) => day.count > peak.count ? day : peak,
    available[0] ?? { date: new Date().toISOString().slice(0, 10), count: 0 },
  );
  const mostActiveWeekdayIndex = weekdayTotals.reduce(
    (best, count, index) => count > weekdayTotals[best] ? index : best,
    0,
  );

  return {
    availableDays: available.length,
    consistency: available.length ? Math.round((active.length / available.length) * 100) : 0,
    momentum,
    weekendRatio: totalCommits ? Math.round((weekendCommits / totalCommits) * 100) : 0,
    weekendCommits,
    longestStreak,
    currentStreak,
    averageActiveDay: active.length ? Math.round(totalCommits / active.length) : 0,
    mostActiveWeekday: WEEKDAYS[mostActiveWeekdayIndex],
    peakDay,
  };
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-GB", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMomentum(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}
