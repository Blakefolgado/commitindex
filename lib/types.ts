export type ActivityDay = {
  date: string;
  count: number;
};

export type CodeFrequencyWeek = {
  week: number;
  additions: number;
  deletions: number;
};

export type RepoSummary = {
  name: string;
  url: string;
  stars: number;
  commits: number;
  language: string | null;
  pushedAt: string | null;
};

export type OrganizationStats = {
  availableDays: number;
  consistency: number;
  momentum: number;
  weekendRatio: number;
  weekendCommits: number;
  longestStreak: number;
  currentStreak: number;
  averageActiveDay: number;
  mostActiveWeekday: string;
  peakDay: ActivityDay;
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
  codeFrequency: CodeFrequencyWeek[];
  codeFrequencyRepos: number;
  sampledRepos: RepoSummary[];
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  totalLinesChanged: number;
  activeDays: number;
  stats: OrganizationStats;
  coverage: string;
  fetchedAt: string;
};

export type ContributorSummary = {
  login: string;
  avatarUrl: string;
  githubUrl: string;
  commits: number;
  repositories: number;
  additions: number;
  deletions: number;
  weeks: ContributorWeek[];
};

export type ContributorWeek = {
  week: number;
  commits: number;
  additions: number;
  deletions: number;
};

export type ContributorsPayload = {
  org: string;
  sampledRepositories: number;
  contributors: ContributorSummary[];
  fetchedAt: string;
};

export type LeaderboardEntry = {
  org: string;
  name: string;
  category: string;
  description: string;
  avatarUrl: string;
  totalCommits: number;
  activeDays: number;
  stats: OrganizationStats;
  topRepo: RepoSummary | null;
  activity: ActivityDay[];
  fetchedAt: string;
};

export type LeaderboardSnapshot = {
  generatedAt: string;
  source: string;
  entries: LeaderboardEntry[];
};

export type PeopleLeaderboardEntry = ContributorSummary & {
  id: string;
  org: string;
  company: string;
  category: string;
  companyAvatarUrl: string;
};

export type PeopleLeaderboardSnapshot = {
  generatedAt: string;
  source: string;
  entries: PeopleLeaderboardEntry[];
};
