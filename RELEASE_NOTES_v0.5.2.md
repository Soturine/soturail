# SotuRail v0.5.2 - CI Stabilization And Lightweight Quality Fixtures

SotuRail v0.5.2 is a small stabilization release for the v0.5 rail line.

## Highlights

- Fixes stale CI test expectations from v0.4.x/v0.5.x version drift.
- Makes release metadata tests version-aware.
- Makes agent doctor tests validate stable behavior without depending on old exact wording.
- Adds lightweight local quality fixtures for JSON validation, format comparison, context routing, budget output, run workspaces, workflow evidence and agent docs hygiene.
- Realigns the roadmap so the full evaluation suite moves to v0.6.1.

## Not Included

- No npm publish automation.
- No GitHub release automation.
- No heavy benchmark or evaluation harness.
- No network, provider or native-binary requirement.

## Try From Source

```bash
npm install
npm run build
node dist/cli.js --version
npm test
```
