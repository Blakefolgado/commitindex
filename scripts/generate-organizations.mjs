import { readFile, writeFile } from "node:fs/promises";

const leaderboardUrl = new URL("../data/leaderboard.json", import.meta.url);
const snapshotUrl = new URL("../data/organizations.json", import.meta.url);
const leaderboard = JSON.parse(await readFile(leaderboardUrl, "utf8"));
const baseUrl = process.env.COMMIT_INDEX_API_BASE
  || process.env.OPEN_OFFICE_API_BASE
  || "http://localhost:3000";
const endpoint = process.env.COMMIT_INDEX_INGEST_PATH
  || "/api/internal/organizations";
const secret = process.env.COMMIT_INDEX_INGEST_SECRET || "";
const incremental = process.env.COMMIT_INDEX_INCREMENTAL === "1"
  || process.env.OPEN_OFFICE_INCREMENTAL === "1";
const requestedBatchSize = Number.parseInt(
  process.env.COMMIT_INDEX_BATCH_SIZE || process.env.OPEN_OFFICE_BATCH_SIZE || "",
  10,
);

let previousEntries = [];
if (incremental) {
  try {
    previousEntries = JSON.parse(await readFile(snapshotUrl, "utf8")).entries;
  } catch {
    previousEntries = [];
  }
}

const previousByOrg = new Map(
  previousEntries.map((entry) => [entry.org.toLowerCase(), entry]),
);
const organizations = leaderboard.entries.map((entry) => entry.org);
const missing = organizations.filter((org) => !previousByOrg.has(org.toLowerCase()));
const pending = Number.isFinite(requestedBatchSize) && requestedBatchSize > 0
  ? missing.slice(0, requestedBatchSize)
  : missing;
const entries = organizations
  .map((org) => previousByOrg.get(org.toLowerCase()))
  .filter(Boolean);
const failures = [];

async function load(org) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(
        `${baseUrl}${endpoint}/${encodeURIComponent(org)}`,
        {
          headers: secret ? { Authorization: `Bearer ${secret}` } : {},
        },
      );
      if (!response.ok) {
        throw new Error(`${response.status} ${await response.text()}`);
      }
      return { ...await response.json(), org };
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

for (const [index, org] of pending.entries()) {
  try {
    entries.push(await load(org));
    console.log(`${index + 1}/${pending.length} ${org}`);
  } catch (error) {
    failures.push(org);
    console.error(`Skipped ${org}: ${error.message}`);
  }
}

if (failures.length) {
  throw new Error(
    `Refusing to write a partial snapshot; ${failures.length} companies failed: ${failures.join(", ")}`,
  );
}

const entriesByOrg = new Map(entries.map((entry) => [entry.org.toLowerCase(), entry]));
const orderedEntries = organizations
  .map((org) => entriesByOrg.get(org.toLowerCase()))
  .filter(Boolean);

await writeFile(snapshotUrl, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "Stored GitHub repository statistics generated offline; visitor requests never call GitHub",
  entries: orderedEntries,
})}\n`);
console.log(`Wrote ${orderedEntries.length} organization profiles.`);
