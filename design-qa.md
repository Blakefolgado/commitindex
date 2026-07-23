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

No actionable P0, P1, or P2 findings remain.

final result: passed
