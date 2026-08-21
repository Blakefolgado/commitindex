import { readFile, writeFile } from "node:fs/promises";

const companySource = await readFile(new URL("../lib/companies.ts", import.meta.url), "utf8");
const companies = [...companySource.matchAll(
  /\{ org: "([^"]+)", name: "([^"]+)", category: "([^"]+)", description: "([^"]+)" \}/g,
)].map((match) => ({
  org: match[1],
  name: match[2],
  category: match[3],
}));
const leaderboard = JSON.parse(
  await readFile(new URL("../data/leaderboard.json", import.meta.url), "utf8"),
);
const companyAvatars = new Map(
  leaderboard.entries.map((entry) => [entry.org.toLowerCase(), entry.avatarUrl]),
);
const baseUrl = process.env.COMMIT_INDEX_API_BASE
  || "http://localhost:3000";
const ingestSecret = process.env.COMMIT_INDEX_INGEST_SECRET || "";
const incremental = process.env.COMMIT_INDEX_INCREMENTAL === "1";
const snapshotUrl = new URL("../data/people.json", import.meta.url);
const failures = [];
const requestedBatchSize = Number.parseInt(process.env.COMMIT_INDEX_BATCH_SIZE || "", 10);
const requestedWorkers = Number.parseInt(process.env.COMMIT_INDEX_WORKERS || "2", 10);
const workerCount = Math.max(1, Math.min(Number.isFinite(requestedWorkers) ? requestedWorkers : 2, 4));

async function load(company) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(
        `${baseUrl}/api/internal/organizations/${encodeURIComponent(company.org)}/contributors`,
        {
          headers: ingestSecret ? { Authorization: `Bearer ${ingestSecret}` } : {},
        },
      );
      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
      const payload = await response.json();
      return payload.contributors.map((person) => ({
        ...person,
        id: `${company.org}:${person.login}`,
        org: company.org,
        company: company.name,
        category: company.category,
        companyAvatarUrl: companyAvatars.get(company.org)
          || `https://github.com/${company.org}.png?size=80`,
        weeks: person.weeks?.slice(-26) ?? [],
      }));
    } catch (error) {
      if (attempt === 2) {
        console.error(`Skipped ${company.org}: ${error.message}`);
        failures.push(company.org);
        return [];
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

const previousSnapshot = incremental
  ? JSON.parse(await readFile(snapshotUrl, "utf8"))
  : null;
const previousEntries = previousSnapshot?.entries ?? [];
const previousOrgs = new Set(
  previousSnapshot?.organizations
    ?? previousEntries.map((entry) => entry.org.toLowerCase()),
);
const entries = [...previousEntries];
const missing = companies.filter((company) => !previousOrgs.has(company.org.toLowerCase()));
const pending = Number.isFinite(requestedBatchSize) && requestedBatchSize > 0
  ? missing.slice(0, requestedBatchSize)
  : missing;
if (incremental) {
  console.log(`Reusing ${entries.length} existing people; fetching ${pending.length} of ${missing.length} missing companies.`);
}
let cursor = 0;
async function worker() {
  while (cursor < pending.length) {
    const company = pending[cursor];
    cursor += 1;
    const people = await load(company);
    entries.push(...people);
    console.log(`${cursor}/${pending.length} ${company.org} · ${people.length} people`);
  }
}

await Promise.all(Array.from({ length: Math.min(workerCount, pending.length) }, () => worker()));
if (failures.length) {
  throw new Error(`Refusing to write a partial people snapshot; ${failures.length} companies failed: ${failures.join(", ")}`);
}
entries.sort((left, right) => right.commits - left.commits);
await writeFile(snapshotUrl, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "GitHub contributor statistics across each company's eight most recently active public repositories. Company indicates the repository set, not verified employment.",
  organizations: [...new Set([
    ...previousOrgs,
    ...pending.map((company) => company.org.toLowerCase()),
  ])],
  entries,
})}\n`);
console.log(`Wrote ${entries.length} people.`);
