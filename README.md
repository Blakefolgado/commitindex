# Commit Index

Explore public GitHub activity across popular startups and large technology
companies.

Live at [commitindex.com](https://commitindex.com).

## What the grid measures

Each company calendar sums GitHub's official daily commit statistics across the
organisation's eight most recently active public, non-fork, non-archived
repositories.

The grid:

- excludes merge commits because GitHub's repository statistics exclude them;
- excludes private and internal repositories;
- covers GitHub's rolling 52-week statistics window;
- caches results for 24 hours;
- marks dates outside the available window as unavailable rather than zero.

It is a view of public open-source activity, not a measure of company size or
employee productivity.

## Deep dives

- `/company/[org]` adds shipping patterns, repository pulse and contributor
  rankings aggregated across the same repository sample.
- `/leaderboards` ranks the curated directory by commits, consistency,
  momentum, active days and weekend activity for companies and 2,371 public
  contributors.
- `/compare` compares up to three organisations using live cached data.
- `/compare/people` compares individual public contributor activity, additions
  and deletions.
- Company pages render a custom 1200×630 Open Graph image from the same data.

V1 ships 85 fully indexed companies. A larger verified catalogue is checked in
and only becomes visible as its guarded snapshots are generated, preventing
empty rows or incomplete comparisons.

The leaderboard uses a checked-in snapshot so visitors do not trigger hundreds
of GitHub API requests. Refresh it before a release with:

```bash
pnpm leaderboard:generate
```

When adding companies, reuse the current verified rows and fetch only new
organisations:

```bash
OPEN_OFFICE_INCREMENTAL=1 pnpm leaderboard:generate
OPEN_OFFICE_INCREMENTAL=1 pnpm people:generate
```

Large additions can be refreshed in guarded batches:

```bash
OPEN_OFFICE_INCREMENTAL=1 OPEN_OFFICE_BATCH_SIZE=10 OPEN_OFFICE_WORKERS=1 pnpm leaderboard:generate
OPEN_OFFICE_INCREMENTAL=1 OPEN_OFFICE_BATCH_SIZE=10 OPEN_OFFICE_WORKERS=1 pnpm people:generate
```

Both generators refuse to overwrite their snapshots if any requested company
fails, so rate limits cannot silently publish a partial directory.

The UI displays the snapshot's real generation date. A zero GitHub statistics
response is shown as unavailable data, not as proof that a company shipped
nothing.

## Local development

```bash
pnpm install
GITHUB_TOKEN=github_token pnpm dev
```

`GITHUB_TOKEN` is optional for public data, but authenticated requests have a
substantially higher GitHub API rate limit.

## Checks

```bash
pnpm lint
pnpm build
```
