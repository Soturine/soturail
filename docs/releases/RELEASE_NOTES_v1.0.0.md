# SotuRail v1.0.0 - Release Notes

SotuRail v1.0.0 freezes the first stable local Context OS surface for AI coding agents.

## Install

```bash
npm install -g soturail@1.0.0
soturail --version
```

## Highlights

- Stable command surface for status, reports, dashboard, observability, Project Brain, evaluation, benchmarks, native candidate reporting, baseline snapshots, release checks, workflow, harness, diagrams, agents and read-only MCP report resources.
- Strict schema checks with `soturail self schemas --check --strict`.
- Strict v1 readiness checks with `soturail self readiness --v1 --strict`.
- Strict release gates with `soturail release check --strict`.
- Clean-code maintainability checks with `soturail self code-health`.
- Architecture boundary checks with `soturail self architecture --check`.
- Agent host compatibility matrix with `soturail agents matrix`.
- v1 docs for quickstart, schema contracts, stable command surface, agent hosts, clean code and architecture boundaries.

## Stable Boundaries

- All reports remain local artifacts.
- No cloud telemetry or dashboard server is required.
- MCP report resources are read-only.
- TypeScript fallback remains mandatory.
- Native acceleration remains optional and benchmark-gated.
- Experimental rails remain available but are not part of the v1 stable contract until promoted.

## Validation

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run release:check`
- `soturail self schemas --check --strict`
- `soturail self readiness --v1 --strict`
- `soturail self code-health`
- `soturail release check --strict`

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
