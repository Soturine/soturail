# SotuRail v0.8.0 - Release Notes

## Install

```bash
npm install -g soturail@0.8.0
soturail --version
```

## Highlights

- Added Verified Project Brain storage under `.soturail/brain/`.
- Added JSONL records for claims, decisions, bugs, gaps, rules and stale events.
- Added JSON materialized views for project profile, architecture, index, freshness and doctor reports.
- Added `soturail brain init`, `scan`, `profile`, `recall`, `stale`, `doctor` and `export`.
- Added Reverse Specification Rail commands for local scan, claims, specs, gaps and agent handoff export.
- Added `soturail rules from-brain` and `soturail rules doctor`.
- Added `soturail eval run --suite brain`.
- Added agent-safe Project Brain briefs for Claude, Codex, Gemini, Cursor and Generic hosts.

## Safety

- No cloud services, embeddings, external LLM calls or network-required tests.
- Brain exports include source references and stale/suspect warnings.
- Approved memory remains the only memory path suitable for agent export.
- Brain-derived rules are advisory until reviewed.

## Validation

- `npx vitest run tests/v080.test.ts`
- `npx vitest run tests/v070.test.ts`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run release:check`
- `git diff --check`
- `node dist/cli.js brain scan`
- `node dist/cli.js reverse scan ./src`
- `node dist/cli.js eval run --suite brain`

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
