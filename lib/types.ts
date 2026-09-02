export type ActivityDay = {
  date: string;
  count: number;
};

export type PersonContributionDay = ActivityDay & {
  level: number;
};

export type PersonContributionYear = {
  login: string;
  name: string;
  avatarUrl: string;
  githubUrl: string;
  year: number;
  totalContributions: number;
  activeDays: number;
  averageActiveDay: number;
  contributions: PersonContributionDay[];
  fetchedAt: string;
};

export type PersonContributionHistory = Omit<PersonContributionYear, "year"> & {
  createdAt: string;
  firstYear: number;
  lastYear: number;
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

export type OrganizationsSnapshot = {
  generatedAt: string;
  source: string;
  entries: OrganizationActivity[];
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

export type DirectoryEntry = {
  org: string;
  avatarUrl: string;
  commits30d: number;
  commits6m: number;
  commits12m: number;
  weeklyCommits: number[];
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

// Shared by the on-page momentum chart and the /api/og/person share image so
// both render the same window: whole months only, last three years.
export function buildMonthlySeries(contributions: PersonContributionDay[]) {
  const months = new Map<string, number>();
  contributions.forEach((day) => {
    const month = day.date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + day.count);
  });
  const series = [...months].map(([month, total]) => ({
    start: `${month}-01`,
    total,
  }));
  // The in-progress month is a partial count and reads as a cliff; drop it.
  const currentMonth = `${new Date().toISOString().slice(0, 7)}-01`;
  const complete = series.length > 1 && series.at(-1)!.start === currentMonth
    ? series.slice(0, -1)
    : series;
  return complete.slice(-36);
}
