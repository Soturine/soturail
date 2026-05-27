# SotuRail v0.8.1 - Release Notes

## Install

```bash
npm install -g soturail@0.8.1
soturail --version
```

## Highlights

- Polished Project Brain stale detection with source-range relocation events.
- Added `soturail brain consolidate --dry-run` for duplicate claim grouping.
- Added `soturail brain stale --repair-plan` and `soturail brain doctor --repair-plan`.
- Improved agent briefs with verified/suspect/stale separation, section limits, source references and recovery pointers.
- Made `soturail rules from-brain` safer by excluding stale/suspect claims from active rules.
- Expanded the brain evaluation suite with v0.8.1 quality cases.

## Safety

- Repair plans are guidance only. SotuRail does not auto-edit code, docs or claims.
- Project Brain remains local and deterministic: no LLM calls, embeddings, cloud service or network-required tests.
- Native/performance work remains benchmark-gated and TypeScript fallback remains mandatory.

## Validation

- `npx vitest run tests/v081.test.ts`
- `npx vitest run tests/v080.test.ts`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run release:check`
- `git diff --check`
- `node dist/cli.js brain consolidate --dry-run`
- `node dist/cli.js brain stale --repair-plan`
- `node dist/cli.js brain doctor --repair-plan`
- `node dist/cli.js eval run --suite brain`

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
