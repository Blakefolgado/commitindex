# Open Office

Explore public GitHub activity across popular startups and large technology
companies.

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
