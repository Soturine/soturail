# SotuRail v0.2.3 - Release Reliability & CLI Version Sync

SotuRail v0.2.3 fixes CLI version metadata and adds release preflight checks to prevent stale npm/CLI releases.

## Install

    npx soturail@0.2.3 --help
    npm install -g soturail
    soturail --help

## Fixes

- Fixed CLI `--version` output so it matches the npm package version.
- Removed stale hardcoded version metadata from CLI command logic.
- Added release preflight checks before npm publish.

## Release Reliability

- Added version sync validation.
- Added package-lock validation.
- Added npm pack metadata validation.
- Added changelog/release-notes validation.
- Added runtime audit validation.

## Validation

- `npm run build`
- `npm test`
- `npm audit --omit=dev`
- `npm pack --dry-run`
- `node dist/cli.js --version`

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
