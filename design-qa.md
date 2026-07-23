# Design QA

## Evidence

- Directory visual truth: `/Users/blakefolgado/.codex/generated_images/019f8fbb-2c89-76b2-8746-cd739cae721a/call_mwmad7lF8eQL9xtSAKd362Hq.png`
- Compare-screen source capture: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/02-compare-current.png`
- Desktop directory implementation: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/04-directory-improved.png`
- Desktop compare implementation: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/05-compare-improved.png`
- Mobile compare implementation: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/06-compare-mobile-improved.png`
- Normalized directory comparison: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/concept-directory-final.png`
- Compare before/after comparison: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/compare-before-after.png`
- Minimal-copy desktop directory: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/05-directory-after.png`
- Minimal-copy desktop leaderboards: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/06-leaderboards-after.png`
- Minimal-copy desktop compare: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/07-compare-after.png`
- Minimal-copy desktop company: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/08-company-after.png`
- Minimal-copy mobile compare: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/09-compare-mobile-after.png`
- Minimal-copy mobile directory: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/12-directory-mobile-after.png`
- Latest 1440 × 900 directory render: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/10-directory-native-after.png`
- Latest concept/render comparison: `/Users/blakefolgado/.codex/tmp/open-office-minimal-audit-2026-07-23/11-concept-vs-final.png`
- Browser method: Codex in-app browser.
- Desktop viewport and capture: 1440 × 900 CSS pixels at density 1.
- Mobile viewport and capture: 390 × 844 CSS pixels at density 1.
- Directory source pixels: 1586 × 992. It was scaled to 1440 × 893 and padded to 1440 × 900 before the 2880 × 900 side-by-side comparison.
- State: directory with All selected; compare screen with two fully loaded companies; mobile compare screen with Vercel and GitHub fully loaded.

The source, rendered implementations, mobile state, and both same-state comparison images were inspected directly with image review.

## Comparison history

- P1: The compare screen used a native select containing more than 80 companies. It was slow to scan and not searchable.
  - Fix: Replaced it with a focused company search that filters by company or GitHub organisation, shows eight concise results, supports Enter, and closes after selection.
  - Recheck: Search for `GitHub` returned one option; selecting it added a third company and updated the URL.
- P1: Mobile exposed only Company and Commits, hiding Active days, Consistency, Momentum, and Weekend.
  - Fix: Added a compact mobile comparison matrix that keeps every metric visible for up to three companies.
  - Recheck: Five metric rows were visible at 390px with no document overflow.
- P2: Comparison was only discoverable from the global navigation.
  - Fix: Added one restrained `Compare companies` action beside the existing request action on the directory.
  - Recheck: The directory stayed visually aligned with the accepted concept and the contextual link opened the compare flow directly.
- P2: The compare canvas was unnecessarily wide and its title dominated the screen.
  - Fix: Reduced the compare shell to 1240px, shortened the title and guidance, and kept the scorecard and activity grids unchanged.
  - Recheck: The desktop before/after comparison shows a tighter, easier-to-scan first viewport.
- P1: A GitHub rate-limit failure only appeared in the console, leaving the selected company missing without an explanation.
  - Fix: Added a concise visible alert for the affected company with a Retry action, while keeping successful comparison data visible.
  - Recheck: The rate-limit state rendered `Hugging Face could not load`, Retry re-ran the request, and a fresh browser tab logged no warnings or errors.
- P2: Page subtitles repeated what the controls and data already made obvious.
  - Fix: Removed the compare guidance, leaderboard snapshot sentence, company handle, sampling notes, activity explanation, and repeated leaderboard panel heading.
  - Recheck: All four primary desktop surfaces are immediately scannable without losing their primary action or data labels.
- P2: Methodology prose and the global `About the data` link competed with the main navigation.
  - Fix: Removed the global link and moved a shortened methodology statement into a collapsed disclosure at the bottom of the directory.
  - Recheck: The global header now contains only the wordmark and three product destinations; methodology remains available on demand.

## Fidelity ledger

| Surface | Result |
| --- | --- |
| Typography | Geist, compact labels, tabular values, and the existing weight hierarchy are preserved. The compare heading is deliberately reduced to 32px desktop and 28px mobile. |
| Spacing and layout | The open list/table container model remains. The directory gained one text action without changing row density; comparison now uses a focused 1240px shell. |
| Colour and tokens | Near-black background, gray rules, blue actions, and GitHub green activity and momentum states remain unchanged. |
| Images and assets | Real GitHub organisation avatars and real activity data remain sharp and correctly framed. No placeholder or decorative assets were introduced. |
| Copy and content | Page subtitles and repeated sampling explanations are removed. Headings, metric labels, error recovery, and the compact on-demand methodology remain. |
| Icons | Existing Lucide search, close, and arrow icons retain consistent stroke, size, alignment, and accessible labelling. |
| Responsiveness | Mobile keeps all comparison metrics visible, the picker spans the available width, and document scroll width equals 390px. |

The latest above-the-fold copy diff contains only intentional removals and one shortening: `Who’s shipping in public?` becomes `Leaderboards`, `Choose up to three companies.` is removed, and `Search to add company` becomes `Add company`. No subtitles, badges, explanatory panels, or extra chrome were added.

## Functional checks

- Directory contextual compare link opens `/compare`.
- Search picker filters `GitHub` to one option.
- Adding GitHub produces three scorecard rows and updates `orgs` in the URL.
- Keyboard selection with Enter adds GitHub as the third company.
- Removing Stripe restores the picker and updates the URL.
- Mobile matrix renders Commits, Active days, Consistency, Momentum, and Weekend.
- GitHub API failures render a visible company-specific message and working Retry action.
- Desktop and mobile browser consoles contain no warnings or errors.
- Lint and production build pass.

## Readable grid follow-up

### Evidence

- User grid-size reference: `/var/folders/pn/y6tmtkw91nd2n89bldb2qjl40000gn/T/TemporaryItems/NSIRD_screencaptureui_3yvTZ6/Screenshot 2026-07-23 at 17.07.41.png`
- Desktop company before: `/Users/blakefolgado/.codex/tmp/open-office-grid-qa-2026-07-23/01-company-desktop-before.png`
- Mobile comparison before: `/Users/blakefolgado/.codex/tmp/open-office-grid-qa-2026-07-23/02-compare-mobile-before.png`
- Desktop company after: `/Users/blakefolgado/.codex/tmp/open-office-grid-qa-2026-07-23/06-company-desktop-final.png`
- Mobile comparison after: `/Users/blakefolgado/.codex/tmp/open-office-grid-qa-2026-07-23/05-compare-mobile-final.png`
- Focused source/final comparison: `/Users/blakefolgado/.codex/tmp/open-office-grid-qa-2026-07-23/07-source-vs-final-grid.png`
- Desktop viewport: 1440 × 900 CSS pixels at density 1.
- Mobile viewport: 390 × 844 CSS pixels at density 1.
- Source pixels: 3098 × 1718. It was normalized to 1623 × 900 for the focused comparison.
- Implementation pixels: 1440 × 900.
- Comparison pixels: 3087 × 900, including a 24px divider.
- State: 12-month public activity on the Vercel company page; two-company comparison on mobile.

The reference and implementation show different companies and surrounding page structures, so the focused comparison judges grid scale, legibility, rhythm, and year visibility rather than exact cell data.

### Comparison history

- P1: Comparison cells measured 13px on mobile and company-page cells fell to 11px, making the primary visualization feel miniature.
  - Fix: Increased the company grid to 18px on desktop and 16px on mobile; increased comparison grids to 17px on desktop and 16px on mobile.
  - Recheck: The 1440px company view retains all 52 weeks at 18px. The 390px comparison view keeps 16px cells and exposes the year through horizontal touch scrolling.
- P2: Month, weekday, and legend labels were 9px and looked weak beside the enlarged cells.
  - Fix: Increased the labels and legend to 10px and the legend swatches to 10px.
  - Recheck: Labels remain subordinate but readable in both final captures.
- P1: The first mobile enlargement caused the heatmap container to expand to 1090px and be clipped by document overflow, so the unseen weeks were not reachable.
  - Fix: Constrained the heatmap scroller and comparison grid items with explicit width and minimum-width rules while keeping momentum scrolling.
  - Recheck: At 390px, document width remains 390px, the scroller is 332px wide with 1090px of content, and `scrollLeft` reaches 280px.

### Fidelity ledger

| Surface | Result |
| --- | --- |
| Typography | Month, weekday, and legend labels are now 10px; the existing Geist family, hierarchy, and copy remain unchanged. |
| Spacing and layout | The grid is materially larger. The desktop year still fits in one view; mobile deliberately scrolls horizontally inside the activity panel. |
| Colour and tokens | GitHub green intensity steps, near-black surface, borders, and muted labels are unchanged. |
| Images and assets | Company avatars and existing Lucide icons are unchanged. No generated, placeholder, CSS, or inline-SVG assets were introduced. |
| Copy and content | No visible copy changed. The above-the-fold copy diff is empty. |
| Responsiveness | 18px desktop cells and 16px mobile cells remain contained, with no document-level horizontal overflow. |
| Interaction | Period controls are unchanged. Mobile horizontal swipe was exercised and exposes later weeks without moving the page. |

No actionable P0, P1, or P2 findings remain after the second comparison.

No actionable P0, P1, or P2 findings remain.

## Velocity chart follow-up

### Evidence

- Accepted visual system: `/Users/blakefolgado/.codex/generated_images/019f8fbb-2c89-76b2-8746-cd739cae721a/call_mwmad7lF8eQL9xtSAKd362Hq.png`
- Desktop company chart: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/01-company-chart.png`
- Desktop comparison chart: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/02-compare-chart.png`
- Mobile comparison chart: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/03-compare-mobile-chart.png`
- Mobile company viewport: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/06-company-mobile-viewport.png`
- Mobile comparison after horizontal scroll: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/07-compare-mobile-scrolled.png`
- Browser method: Codex in-app browser.
- Desktop viewport: 1440 × 900 CSS pixels at density 1.
- Mobile viewport: 390 × 844 CSS pixels at density 1.
- State: Vercel company activity and Vercel/Stripe comparison with live GitHub data.

The accepted concept does not include the newly requested velocity visualization. It is used here as the visual-system reference for typography, palette, density, border treatment, and container behavior rather than as an exact content mock.

### Fidelity ledger

| Surface | Result |
| --- | --- |
| Typography | Existing Geist hierarchy is preserved. `Velocity` uses the established 18px section heading; chart dates and legend values use the existing 9–11px data-label scale. |
| Spacing and layout | The company chart is an open full-width band between activity and detail data. Compare uses one existing bordered-panel treatment beneath the scorecard. |
| Colour and tokens | Vercel uses GitHub green, additional comparison series use existing blue and a restrained GitHub-compatible purple. Background, guides, borders, and text use existing tokens. |
| Images and assets | No new image assets or decorative graphics were added. The charts are semantic data UI rendered from live activity values. |
| Copy and content | User-authorized additions are limited to `Velocity`, `/week`, and `momentum`. No subtitle or explainer copy was added. |
| Responsiveness | The single-company 12-week chart fits 354px. The multi-company plot is 620px inside a 332px scroller; document width stays 390px and horizontal scroll reaches 288px. |
| Interaction | Hover titles expose exact company, commits, and week on desktop. Mobile horizontal swipe exposes later weeks without moving the page. |

The chart uses trailing seven-day totals, a four-week average for `/week`, and the existing 30-day momentum calculation. Twelve weekly groups are visible on desktop; mobile comparison deliberately scrolls to preserve bar legibility.

The above-the-fold directory copy diff is empty. On Compare, the only new visible copy is the requested chart title and its compact legend. No actionable P0, P1, or P2 findings remain.

## Velocity range follow-up

### Evidence

- Weekly company view: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/10-week-month-year-weekly.png`
- Monthly company view: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/11-week-month-year-monthly.png`
- Monthly company view at 390px: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/12-mobile-monthly.png`
- Monthly comparison view at 390px: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/13-compare-mobile-monthly.png`
- Browser method: Codex in-app browser.
- Desktop viewport: 1440 × 900 CSS pixels at density 1.
- Mobile viewport: 390 × 844 CSS pixels at density 1.
- State: Vercel company activity and Vercel/Stripe comparison with live GitHub data.

GitHub's commit-activity source provides approximately the latest 12 months. The implementation therefore reports an honest rolling 365-day total rather than implying that unavailable multi-year history exists.

### Metric definitions

- `/week`: average of the latest four complete seven-day totals.
- `/month`: trailing 30-day commit total.
- `/year`: trailing 365-day commit total.
- `acceleration`: latest 30 days compared with the preceding 30 days.
- Weekly bars: 12 trailing seven-day totals.
- Monthly bars: commit totals grouped into the 12 available calendar months.

### Fidelity ledger

| Surface | Result |
| --- | --- |
| Typography | Existing section and data-label scales remain. The four headline metrics use the established compact stat hierarchy. |
| Spacing and layout | One toolbar contains all four metrics and the Weekly/Monthly switch. The full-width chart remains an open band with no extra panel or explanation. |
| Colour and tokens | Existing GitHub green, comparison blue, guide lines, borders, and active-control treatment are reused. |
| Images and assets | No new decorative assets were added. All bars are semantic data UI generated from live activity. |
| Copy and content | Additions are limited to `Weekly`, `Monthly`, `/week`, `/month`, `/year`, and `acceleration`. No subtitle or explainer copy was added. |
| Responsiveness | Four KPIs, the range switch, and 12 monthly bars fit at 390px. Multi-company bars remain 620px wide inside a 332px touch scroller; document width remains 390px. |
| Interaction | Weekly and Monthly controls were exercised in company and comparison views. Comparison horizontal scroll reached 288px. |

The directory's above-the-fold copy remains unchanged. Browser consoles contained no warnings or errors, and no actionable P0, P1, or P2 findings remain.

## Lines-changed comparison follow-up

### Evidence

- Accepted visual system: `/Users/blakefolgado/.codex/generated_images/019f8fbb-2c89-76b2-8746-cd739cae721a/call_mwmad7lF8eQL9xtSAKd362Hq.png`
- Desktop company lines view: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/16-lines-company-desktop.png`
- Mobile lines comparison: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/17-lines-compare-mobile.png`
- Browser method: Codex in-app browser.
- Desktop viewport: 1440 × 900 CSS pixels at density 1.
- Mobile viewport: 390 × 844 CSS pixels at density 1.
- State: Vercel company lines view and Vercel/Stripe monthly lines comparison with authenticated live GitHub data.

### Metric definitions

- Lines changed: additions plus the absolute value of deletions.
- `/week`: average across the latest four GitHub weekly aggregates.
- `/month`: total across the latest four GitHub weekly aggregates.
- `/year`: total across the latest 52 GitHub weekly aggregates.
- Line acceleration: latest four weeks compared with the preceding four weeks.
- Monthly bars: weekly line totals grouped into their 12 available calendar months.

GitHub excludes repositories with 10,000 or more commits from code-frequency results. Unsupported sampled repositories are excluded rather than counted as zero. In the verified state, line data loaded for 5 Vercel sampled repositories and 7 Stripe sampled repositories.

### Fidelity ledger

| Surface | Result |
| --- | --- |
| Typography | The new metric controls use the existing 10px chart-control type. Line totals reuse established tabular stat sizing. |
| Spacing and layout | `Commits / Lines` sits beside `Weekly / Monthly` inside the existing toolbar. No new chart, panel, subtitle, or explainer was added. |
| Colour and tokens | Existing selected-control, GitHub green, comparison blue, positive, and negative tokens are reused without introducing a new palette. |
| Images and assets | No assets were added. Line charts are semantic live-data UI. |
| Copy and content | Visible additions are limited to `Lines` and `Lines changed`. In the comparison score, `Weekend` was replaced rather than adding another row or column. |
| Responsiveness | Both two-option controls fit on one line at 390px. The comparison plot remains 620px inside a 332px scroller; document width remains 390px. |
| Interaction | Commits/Lines and Weekly/Monthly combinations were exercised. Mobile horizontal scroll reached 288px. Exact additions and deletions are available in desktop bar titles. |

The directory's above-the-fold copy remains unchanged. Browser consoles contained no warnings or errors. Direct comparison of the accepted visual system and latest implementation found no actionable P0, P1, or P2 mismatch.

## Deleted-lines visibility follow-up

### Evidence

- Accepted visual system: `/Users/blakefolgado/.codex/generated_images/019f8fbb-2c89-76b2-8746-cd739cae721a/call_mwmad7lF8eQL9xtSAKd362Hq.png`
- Desktop company deleted-lines view: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/20-deleted-company-desktop.png`
- Mobile deleted-lines comparison: `/Users/blakefolgado/.codex/tmp/open-office-chart-qa-2026-07-23/21-deleted-compare-mobile.png`
- Browser method: Codex in-app browser.
- Desktop viewport: 1440 × 900 CSS pixels at density 1.
- Mobile viewport: 390 × 844 CSS pixels at density 1.
- State: Vercel monthly deleted-lines view and Vercel/Stripe monthly deleted-lines comparison with authenticated live GitHub data.

### Comparison history

- P1: Deleted lines were available only inside a combined line-change total and desktop hover title.
  - Fix: Replaced the combined metric switch with direct `Commits`, `Added`, and `Deleted` modes.
  - Recheck: Selecting `Deleted` updates bars, `/week`, `/month`, `/year`, acceleration, chart accessibility text, and exact bar titles.
- P1: The comparison score did not expose deleted-line totals.
  - Fix: Replaced `Lines changed` with `Lines deleted`, preserving the same row and column count.
  - Recheck: Mobile shows Vercel and Stripe deleted totals in the primary comparison matrix.
- P2: A third metric control could have wrapped or reduced chart width on mobile.
  - Fix: Kept all metric and interval controls in the existing 332px toolbar.
  - Recheck: All five controls fit on one 28px row at 390px; document width remains 390px and chart scroll reaches 288px.

### Fidelity ledger

| Surface | Result |
| --- | --- |
| Typography | Added and Deleted use the existing 10px control typography and established compact stat scale. |
| Spacing and layout | No new section or panel was introduced. One extra metric button fits inside the existing toolbar. |
| Colour and tokens | Single-company deleted bars use the existing GitHub red token. Multi-company bars retain company colours so comparison identity remains clear. |
| Images and assets | No assets changed. All states remain code-native live-data UI. |
| Copy and content | `Lines` became `Added` and `Deleted`; `Lines changed` became `Lines deleted`. No subtitle or explainer was added. |
| Responsiveness | The primary mobile matrix, toolbar, and scrollable plot remain contained at 390px. |
| Interaction | Commits, Added, and Deleted modes were exercised with weekly/monthly controls. Exact additions and deletions remain in desktop bar titles. |

The directory's above-the-fold copy remains unchanged. Browser consoles contained no warnings or errors. Direct comparison of the accepted visual system and latest implementation found no actionable P0, P1, or P2 mismatch.

final result: passed
