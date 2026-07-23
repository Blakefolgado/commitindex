export type ActivityDay = {
  date: string;
  count: number;
};

export type RepoSummary = {
  name: string;
  url: string;
  stars: number;
  commits: number;
};

export type OrganizationActivity = {
  org: string;
  name: string;
  description: string | null;
  avatarUrl: string;
  githubUrl: string;
  websiteUrl: string | null;
  publicRepos: number;
  followers: number;
  activity: ActivityDay[];
  sampledRepos: RepoSummary[];
  totalCommits: number;
  activeDays: number;
  coverage: string;
  fetchedAt: string;
};
