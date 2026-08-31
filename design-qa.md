# RivalTrace design QA — selected pink direction

## Comparison target

- Source visual truth: `/Users/sunrui/.codex/generated_images/01a031d2-7efa-7042-b45d-62f9765c8758/exec-5f24de3c-fe6f-4849-95f2-8189fc9087a7.png`
- Final homepage capture: `/Users/sunrui/Documents/ChatGPT/Toplify/rivaltrace-demo/qa-pink/home-desktop-final.png`
- Normalized comparison: `/Users/sunrui/Documents/ChatGPT/Toplify/rivaltrace-demo/qa-pink/comparison-pass2.png`
- Mobile homepage: `/Users/sunrui/Documents/ChatGPT/Toplify/rivaltrace-demo/qa-pink/home-mobile-pass1.png`
- Dashboard and evidence: `qa-pink/watchlist-desktop.png`, `qa-pink/report-desktop.png`, and `qa-pink/report-mobile.png`
- Desktop comparison viewport: 1254 × 1254 CSS px, DPR 1. Source and normalized implementation are 1254 × 1254 pixels.
- Mobile viewport: 390 × 844 CSS px, DPR 1. Full-page capture is 390 × 4315 pixels.
- State: homepage empty URL, illustrative three-row watchlist; other screenshots use the default sample workspace/report.

## Full-view comparison evidence

The selected composition is preserved: cool-pink hero, centered eyebrow/title, URL entry with raspberry CTA, sample-report link, white watchlist card, decorative beauty products, evidence line and three-step rail. The site continues below the selected frame with supporting evidence, guides, FAQ and a CTA. Product imagery remains secondary to the monitoring UI, as agreed.

## Focused region evidence

- Homepage first-view crop: `qa-pink/home-mobile-first-view.png` confirms mobile title, URL input, CTA and first watchlist row remain readable without horizontal overflow.
- `qa-pink/report-desktop.png` confirms readable before/after evidence, limitations, checklist and decision controls.
- `qa-pink/watchlist-desktop.png` confirms the shared card, badge, typography and spacing system carries into the product workspace.

## Fidelity surfaces

- Fonts and typography: Inter 400–700 is consistently used. Scale, weight, wrapping and hierarchy visually match the selected direction. The generated mock's exact latent typeface is unavailable; Inter is an accepted close match.
- Spacing and layout rhythm: Centered hero, form, watchlist and steps match the reference composition. Desktop and 390px mobile have no horizontal overflow. Mobile intentionally hides decorative product cutouts and stacks each table row.
- Colors and tokens: cool pale pink, white, plum, raspberry, lilac and mint replace the legacy black/cobalt palette. Contrast and focus states remain distinct.
- Image quality: both product photographs are generated raster assets. Transparent WebP cutouts remove the pass-1 rectangular backdrop mismatch; supporting WebP photos are compressed to 28–36 KB and cutouts to 88–184 KB.
- Copy and content: homepage and product flow describe observable public changes. Fictional examples, first-capture baseline behavior, no-API limitation, and simulated checkout are explicitly disclosed.
- Icons: Phosphor icons are used consistently; no hand-built SVG or CSS illustration substitutes.
- Accessibility and responsive behavior: labels, focus treatment, skip link, alerts, pressed states, progress state, reduced-motion handling, menu state, mobile tap targets and alt text were checked. Browser console had no errors or warnings.

## Interaction checks

- Empty and valid competitor URL states.
- Change-type selection, disabled state and progress.
- End-to-end demo baseline → watchlist, with 0 observed real changes.
- Watchlist filters, search, empty state and evidence link.
- Evidence decision: Adopt / Later / Ignore.
- Mobile navigation.
- Monthly/yearly price toggle; Growth $63.20 monthly equivalent and $758.40 yearly total remain consistent in checkout.
- Demo checkout completion confirms $0 charged and no subscription/monitoring started.
- All requested images loaded; no third-party API calls were added.

## Comparison history

Pass 1 found two P2 issues: generated product images showed rectangular backdrops, and the hero/table vertical rhythm drifted from the reference. The products were locally background-extracted into alpha WebP assets, the title/table spacing was adjusted, and both source and implementation were recombined in `comparison-pass2.png`. Pass 2 found no remaining actionable P0/P1/P2 mismatches.

## Remaining P3

The source is an image-generation concept rather than a measured Figma file, so exact sub-pixel typography cannot be asserted. Decorative products are intentionally smaller than the mock to keep the software watchlist dominant.

final result: passed
