import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/companies.ts", import.meta.url), "utf8");
const companies = [...source.matchAll(/\{ org: "([^"]+)", name: "([^"]+)", category: "([^"]+)", description: "([^"]+)" \}/g)]
  .map((match) => ({ org: match[1], name: match[2], category: match[3], description: match[4] }));
const baseUrl = process.env.COMMIT_INDEX_API_BASE
  || "http://localhost:3000";
const ingestSecret = process.env.COMMIT_INDEX_INGEST_SECRET || "";
const incremental = process.env.COMMIT_INDEX_INCREMENTAL === "1";
const snapshotUrl = new URL("../data/leaderboard.json", import.meta.url);
const failures = [];
const requestedBatchSize = Number.parseInt(process.env.COMMIT_INDEX_BATCH_SIZE || "", 10);
const onlyOrgs = (process.env.COMMIT_INDEX_ONLY || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const requestedWorkers = Number.parseInt(process.env.COMMIT_INDEX_WORKERS || "2", 10);
const workerCount = Math.max(1, Math.min(Number.isFinite(requestedWorkers) ? requestedWorkers : 2, 4));

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
      const response = await fetch(`${baseUrl}/api/internal/organizations/${company.org}`, {
        headers: ingestSecret ? { Authorization: `Bearer ${ingestSecret}` } : {},
      });
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
        failures.push(company.org);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

const previousEntries = incremental
  ? JSON.parse(await readFile(snapshotUrl, "utf8")).entries
  : [];
const previousByOrg = new Map(previousEntries.map((entry) => [entry.org.toLowerCase(), entry]));
const entries = [];
const missing = companies.filter((company) => {
  const previous = previousByOrg.get(company.org.toLowerCase());
  if (!previous) return true;
  entries.push({ ...previous, ...company });
  return false;
});
// COMMIT_INDEX_ONLY=org[,org] refreshes just those, for adding one company
// without re-fetching every other one that is missing from the snapshot.
const selected = onlyOrgs.length
  ? missing.filter((company) => onlyOrgs.includes(company.org.toLowerCase()))
  : missing;
const pending = Number.isFinite(requestedBatchSize) && requestedBatchSize > 0
  ? selected.slice(0, requestedBatchSize)
  : selected;
if (incremental) {
  console.log(`Reusing ${entries.length} existing entries; fetching ${pending.length} of ${missing.length} missing companies.`);
}
let cursor = 0;
async function worker() {
  while (cursor < pending.length) {
    const company = pending[cursor];
    cursor += 1;
    const entry = await load(company);
    if (entry) entries.push(entry);
    console.log(`${entries.length}/${companies.length} ${company.org}`);
  }
}

await Promise.all(Array.from({ length: Math.min(workerCount, pending.length) }, () => worker()));
if (failures.length) {
  throw new Error(`Refusing to write a partial snapshot; ${failures.length} companies failed: ${failures.join(", ")}`);
}
entries.sort((a, b) => b.totalCommits - a.totalCommits);
await writeFile(snapshotUrl, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "GitHub repository statistics across each organisation's eight most recently active public repositories",
  entries,
}, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries.`);
