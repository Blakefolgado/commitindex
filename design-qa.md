# Design QA

## Evidence

- Accepted concept: `/Users/blakefolgado/.codex/generated_images/019f8fbb-2c89-76b2-8746-cd739cae721a/call_mwmad7lF8eQL9xtSAKd362Hq.png`
- Desktop implementation: `/Users/blakefolgado/.codex/tmp/open-office-design-qa-2026-07-23/.qa-directory-clean-v2.png`
- Normalized comparison: `/Users/blakefolgado/.codex/tmp/open-office-design-qa-2026-07-23/.qa-directory-comparison-v2.png`
- Mobile implementation: `/Users/blakefolgado/.codex/tmp/open-office-design-audit-2026-07-23/mobile-390x844.png`
- Browser method: Chrome extension captured the normalized desktop comparison while the in-app browser was unavailable; the final interaction, responsive, and console checks used the Codex in-app browser.
- Viewports: 1600 × 1000 desktop and 390 × 844 mobile.
- Pixel normalization: the 1600 × 992 concept was padded to 1600 × 1000 before comparison. Browser density was 1 CSS pixel per captured pixel.

The concept, implementation, mobile capture, and normalized side-by-side comparison were inspected directly with image review.

## Fidelity review

| Surface | Result |
| --- | --- |
| Typography | Geist matches the restrained sans-serif direction. Heading, navigation, table labels, and company names use the compact scale and weight shown in the concept. |
| Spacing and layout | Compact header, narrow page shell, single search row, horizontal category filters, and dense company rows match. Eighteen rows are visible above the fold at the comparison viewport. |
| Colour and tokens | Near-black background, subtle gray rules, muted labels, GitHub green activity cells, and restrained blue action treatment match the concept. |
| Images and data | Real GitHub organisation avatars are used. The activity strip is generated from the real snapshot rather than decorative placeholder art. |
| Copy | The page uses the same essential labels: Companies, search, Request a company, categories, activity, and commits. Company subtitles and descriptions are intentionally absent. |
| Interactions | Search, category filtering, empty-state request, request dialog, GitHub organisation validation, and company navigation were exercised. |
| Responsive behaviour | Mobile has no horizontal overflow. Secondary activity and commit columns collapse, preserving rank, logo, name, and navigation. |

## Iterations

- P2: The first implementation had a 70px header and 48px rows, showing fewer companies than the concept.
- Fix: Header reduced to 54px; rows reduced to 40px; avatars reduced to 24px; row type reduced to 13px.
- Recheck: Density, hierarchy, dividers, search, category navigation, and above-the-fold row count now closely match.
- P3 accepted deviation: Commit totals and activity intensity differ from the illustrative concept because the shipped interface uses real company snapshot data.
- No P0, P1, or remaining P2 visual mismatches were found.

## Functional checks

- Search for `Vercel`: one matching company.
- `AI` category: ten matching companies.
- Invalid request: inline validation appears.
- Valid `github.com/vercel` request: opens the Vercel company page.
- Mobile document width: 390px viewport and 390px scroll width.
- Browser console: no new warnings or errors after the scroll-behaviour metadata fix.

final result: passed
