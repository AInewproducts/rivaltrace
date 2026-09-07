# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## RivalTrace design decisions

- Selected visual truth (2026-08-28): the third displayed pink homepage mock, `exec-5f24de3c-fe6f-4849-95f2-8189fc9087a7.png`. Centered hero, URL entry, white watchlist card, cool pale pink, raspberry CTA, plum text, lilac/mint badges. This supersedes the legacy dark/cobalt theme.
- Apply the selected theme across the existing site. Keep product photography secondary to the monitoring UI; reduce decoration on mobile. No external APIs or backend changes are part of this visual reconstruction.
- Continue to avoid beige, cream, ivory, tan, brown, taupe, parchment, or warm-white surfaces.
- Homepage conversion order is: value proposition, competitor URL input, sample evidence trail.
- Logged-in core flow is: Today's radar → evidence report → adopt/later/ignore decision.
- The production site includes plan selection and PayPal automatically renewing subscriptions. Sandbox-only copy must never appear after Live billing is enabled, and no agent may complete a real purchase without explicit confirmation at action time.
- Use Inter for product and display text, IBM Plex Mono for metadata, and Phosphor icons for interface iconography.

## Initial launch constraint — 2026-08-28

- The user rejected API spending and requested an initial version without third-party APIs; AI and other integrations may be added later only when users demonstrate demand.
- Do not create API keys, call paid AI services, or replace them with free-tier third-party APIs as a workaround.
- The proposed zero-external-API launch approach is documented in `RivalTrace-no-api-launch-plan.md`. It is a proposal, not an implemented or deployed service.
- Keep factual change detection separate from interpretation. Never present rules/templates as AI-generated insight or invent historical snapshots. Production checkout is real recurring PayPal billing; sandbox and production states must remain visibly distinct.
