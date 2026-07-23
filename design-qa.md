# Design QA

## Evidence

- Directory visual truth: `/Users/blakefolgado/.codex/generated_images/019f8fbb-2c89-76b2-8746-cd739cae721a/call_mwmad7lF8eQL9xtSAKd362Hq.png`
- Compare-screen source capture: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/02-compare-current.png`
- Desktop directory implementation: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/04-directory-improved.png`
- Desktop compare implementation: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/05-compare-improved.png`
- Mobile compare implementation: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/06-compare-mobile-improved.png`
- Normalized directory comparison: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/concept-directory-final.png`
- Compare before/after comparison: `/Users/blakefolgado/.codex/tmp/open-office-ux-audit-2026-07-23/compare-before-after.png`
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

## Fidelity ledger

| Surface | Result |
| --- | --- |
| Typography | Geist, compact labels, tabular values, and the existing weight hierarchy are preserved. The compare heading is deliberately reduced to 32px desktop and 28px mobile. |
| Spacing and layout | The open list/table container model remains. The directory gained one text action without changing row density; comparison now uses a focused 1240px shell. |
| Colour and tokens | Near-black background, gray rules, blue actions, and GitHub green activity and momentum states remain unchanged. |
| Images and assets | Real GitHub organisation avatars and real activity data remain sharp and correctly framed. No placeholder or decorative assets were introduced. |
| Copy and content | Directory copy is unchanged except for the requested `Compare companies` entry. Compare copy is shortened to `Compare companies` and `Choose up to three companies.` |
| Icons | Existing Lucide search, close, and arrow icons retain consistent stroke, size, alignment, and accessible labelling. |
| Responsiveness | Mobile keeps all comparison metrics visible, the picker spans the available width, and document scroll width equals 390px. |

The above-the-fold copy diff contains only intentional functional changes: `Compare companies`, `Choose up to three companies.`, and `Search to add company`. No company subtitles, badges, explanatory panels, or extra chrome were added.

## Functional checks

- Directory contextual compare link opens `/compare`.
- Search picker filters `GitHub` to one option.
- Adding GitHub produces three scorecard rows and updates `orgs` in the URL.
- Removing Stripe restores the picker and updates the URL.
- Mobile matrix renders Commits, Active days, Consistency, Momentum, and Weekend.
- GitHub API failures render a visible company-specific message and working Retry action.
- Desktop and mobile browser consoles contain no warnings or errors.
- Lint and production build pass.

No actionable P0, P1, or P2 findings remain.

final result: passed
