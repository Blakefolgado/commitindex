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

final result: passed
