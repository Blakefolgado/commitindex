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
const baseUrl = process.env.OPEN_OFFICE_API_BASE || "https://open-office.vercel.app";

async function load(company) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(
        `${baseUrl}/api/organizations/${encodeURIComponent(company.org)}/contributors`,
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
        return [];
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
    const people = await load(company);
    entries.push(...people);
    console.log(`${cursor}/${companies.length} ${company.org} · ${people.length} people`);
  }
}

await Promise.all([worker(), worker()]);
entries.sort((left, right) => right.commits - left.commits);
await writeFile(new URL("../data/people.json", import.meta.url), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "GitHub contributor statistics across each company's eight most recently active public repositories. Company indicates the repository set, not verified employment.",
  entries,
})}\n`);
console.log(`Wrote ${entries.length} people.`);
