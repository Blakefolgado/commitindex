import type { Metadata } from "next";
import peopleData from "@/data/people.json";
import { PeopleCompare, type PeopleOption } from "@/components/people-compare";
import type { PeopleLeaderboardEntry, PeopleLeaderboardSnapshot } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compare public GitHub contributors — Open Office",
  description: "Compare individual public contributors across technology company repositories.",
};

const snapshot = peopleData as PeopleLeaderboardSnapshot;
const defaultIds = ["openai:jif-oai", "anthropics:bryan-anthropic"];

export default async function PeopleComparePage({
  searchParams,
}: {
  searchParams: Promise<{ people?: string }>;
}) {
  const params = await searchParams;
  const requested = (params.people || defaultIds.join(","))
    .split(",")
    .map((id) => decodeURIComponent(id).trim().toLowerCase())
    .filter((id, index, all) => (
      /^[a-z0-9-]+:[a-z0-9_.-]+$/.test(id)
      && all.indexOf(id) === index
    ))
    .slice(0, 3);
  const selected = requested
    .map((id) => snapshot.entries.find((entry) => entry.id.toLowerCase() === id))
    .filter((entry): entry is PeopleLeaderboardEntry => Boolean(entry));
  const people = selected.length ? selected : snapshot.entries.slice(0, 2);
  const options: PeopleOption[] = snapshot.entries.map((entry) => ({
    id: entry.id,
    login: entry.login,
    company: entry.company,
    org: entry.org,
    avatarUrl: entry.avatarUrl,
  }));

  return <PeopleCompare people={people} options={options} />;
}
