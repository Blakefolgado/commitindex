import "server-only";

import leaderboardData from "@/data/leaderboard.json";
import organizationsData from "@/data/organizations.json";
import peopleData from "@/data/people.json";
import type {
  ContributorSummary,
  ContributorsPayload,
  LeaderboardSnapshot,
  OrganizationActivity,
  OrganizationsSnapshot,
  PeopleLeaderboardSnapshot,
} from "@/lib/types";

export const leaderboardSnapshot = leaderboardData as LeaderboardSnapshot;
export const organizationsSnapshot = organizationsData as OrganizationsSnapshot;
export const peopleSnapshot = peopleData as PeopleLeaderboardSnapshot;

const organizationsByOrg = new Map(
  organizationsSnapshot.entries.map((entry) => [entry.org.toLowerCase(), entry]),
);

const contributorsByOrg = new Map<string, ContributorSummary[]>();
for (const entry of peopleSnapshot.entries) {
  const org = entry.org.toLowerCase();
  const contributors = contributorsByOrg.get(org);
  if (contributors) {
    contributors.push(entry);
  } else {
    contributorsByOrg.set(org, [entry]);
  }
}

export function getStoredOrganization(org: string): OrganizationActivity | undefined {
  return organizationsByOrg.get(org.toLowerCase());
}

export function getStoredContributors(org: string): ContributorsPayload | undefined {
  const organization = getStoredOrganization(org);
  if (!organization) return undefined;

  return {
    org: organization.org,
    sampledRepositories: organization.sampledRepos.length,
    contributors: contributorsByOrg.get(organization.org.toLowerCase()) ?? [],
    fetchedAt: peopleSnapshot.generatedAt,
  };
}
