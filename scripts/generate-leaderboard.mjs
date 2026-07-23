import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/companies.ts", import.meta.url), "utf8");
const companies = [...source.matchAll(/\{ org: "([^"]+)", name: "([^"]+)", category: "([^"]+)", description: "([^"]+)" \}/g)]
  .map((match) => ({ org: match[1], name: match[2], category: match[3], description: match[4] }));
const baseUrl = process.env.OPEN_OFFICE_API_BASE || "https://open-office.vercel.app";

function calculateStats(activity) {
  const active = activity.filter((day) => day.count > 0);
  const totals = Array.from({ length: 7 }, () => 0);
  let weekendCommits = 0;
  let longestStreak = 0;
  let running = 0;
  for (const day of activity) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    totals[weekday] += day.count;
    if (weekday === 0 || weekday === 6) weekendCommits += day.count;
    running = day.count > 0 ? running + 1 : 0;
    longestStreak = Math.max(longestStreak, running);
  }
  let currentStreak = 0;
  for (let index = activity.length - 1; index >= 0 && activity[index].count > 0; index -= 1) currentStreak += 1;
  const total = activity.reduce((sum, day) => sum + day.count, 0);
  const recent = activity.slice(-30).reduce((sum, day) => sum + day.count, 0);
  const previous = activity.slice(-60, -30).reduce((sum, day) => sum + day.count, 0);
  const peakDay = activity.reduce((peak, day) => day.count > peak.count ? day : peak, activity[0] || { date: "", count: 0 });
  const bestWeekday = totals.reduce((best, value, index) => value > totals[best] ? index : best, 0);
  return {
    availableDays: activity.length,
    consistency: activity.length ? Math.round((active.length / activity.length) * 100) : 0,
    momentum: previous === 0 ? recent > 0 ? 100 : 0 : Math.round(((recent - previous) / previous) * 100),
    weekendRatio: total ? Math.round((weekendCommits / total) * 100) : 0,
    weekendCommits,
    longestStreak,
    currentStreak,
    averageActiveDay: active.length ? Math.round(total / active.length) : 0,
    mostActiveWeekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][bestWeekday],
    peakDay,
  };
}

async function load(company) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/organizations/${company.org}`);
      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
      const data = await response.json();
      return {
        ...company,
        avatarUrl: data.avatarUrl,
        totalCommits: data.totalCommits,
        activeDays: data.activeDays,
        stats: data.stats || calculateStats(data.activity),
        topRepo: data.sampledRepos[0] || null,
        activity: data.activity.slice(-112),
        fetchedAt: data.fetchedAt,
      };
    } catch (error) {
      if (attempt === 2) {
        console.error(`Skipped ${company.org}: ${error.message}`);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

const entries = [];
let cursor = 0;
async function worker() {
  while (cursor < companies.length) {
    const company = companies[cursor];
    cursor += 1;
    const entry = await load(company);
    if (entry) entries.push(entry);
    console.log(`${entries.length}/${companies.length} ${company.org}`);
  }
}

await Promise.all([worker(), worker()]);
entries.sort((a, b) => b.totalCommits - a.totalCommits);
await writeFile(new URL("../data/leaderboard.json", import.meta.url), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "GitHub repository statistics across each organisation's eight most recently active public repositories",
  entries,
}, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries.`);
