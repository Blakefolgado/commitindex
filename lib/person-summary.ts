import type { PersonContributionHistory } from "@/lib/types";
import { buildMonthlySeries } from "@/lib/types";

export type PersonSummary = {
  avatarUrl: string;
  contributions30d: number;
  contributions12m: number;
  contributionsPrior12m: number;
  login: string;
  months: number[];
  name: string;
  streak: number;
};

function sumSince(
  contributions: PersonContributionHistory["contributions"],
  start: string,
  end: string,
) {
  return contributions
    .filter((day) => day.date >= start && day.date <= end)
    .reduce((sum, day) => sum + day.count, 0);
}

function dayOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Consecutive active days ending at the latest day, ignoring a still-empty today. */
function currentStreak(contributions: PersonContributionHistory["contributions"]) {
  let streak = 0;
  for (let index = contributions.length - 1; index >= 0; index -= 1) {
    if (contributions[index].count > 0) streak += 1;
    else if (index < contributions.length - 1) break;
  }
  return streak;
}

export function summarizePerson(person: PersonContributionHistory): PersonSummary {
  const today = new Date().toISOString().slice(0, 10);
  return {
    avatarUrl: person.avatarUrl,
    contributions30d: sumSince(person.contributions, dayOffset(30), today),
    contributions12m: sumSince(person.contributions, dayOffset(365), today),
    contributionsPrior12m: sumSince(person.contributions, dayOffset(730), dayOffset(366)),
    login: person.login,
    months: buildMonthlySeries(person.contributions).map((month) => month.total),
    name: person.name,
    streak: currentStreak(person.contributions),
  };
}
