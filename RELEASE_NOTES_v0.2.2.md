# SotuRail v0.2.2 - Self-Dogfooding & Reliability

SotuRail v0.2.2 adds the first self-dogfooding workflow: the project can now validate itself using SotuRail commands before release.

## Install

- `npx soturail@0.2.2 --help`
- `npm install -g soturail`
- `soturail --help`

## Highlights

- `soturail self doctor`
- `soturail self index`
- `soturail self build`
- `soturail self test`
- `soturail self bench`
- `soturail self report`
- `soturail self all`
- Cache-friendly self-dogfood report.
- Honest tiny-output stats accounting.
- Expanded benchmark categories.
- Windows documentation.

## Validation

- `npm run build`: passed (`tsc -p tsconfig.json`)
- `npm test`: passed (1 passed)
- `npm audit --omit=dev`: passed (`found 0 vulnerabilities`)
- `node dist/cli.js self all`: passed (report: .soturail\reports\self-dogfood.md)
- `npm pack --dry-run`: passed (soturail-0.2.2.tgz)

## Audit Notes

Runtime audit is clean with `npm audit --omit=dev`. Remaining audit findings, if any, are development dependency findings and should be upgraded safely without `--force`.

- Runtime audit findings: 0
- Full audit findings: 5
- Development-only findings: @vitest/mocker, esbuild, vite, vite-node, vitest

## Notes

SotuRail does not claim provider cache hits unless real provider metadata is imported.

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
