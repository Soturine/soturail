Version and changelog are prepared for 1.3.0, but the release is not ready to publish: the test suite fails on the 1024-byte boundary the changelog says is fixed.

**What changed (uncommitted):**
- `package.json` and `src/version.js`: `1.2.3` → `1.3.0`. These are the only two places the version is declared. The `VERSION matches package.json` test passes.
- `CHANGELOG.md`: the Unreleased entries (the `decimals` option and the boundary fix) moved under `## [1.3.0] - 2026-10-18`. An empty `## [Unreleased]` heading stays at the top.

**Why it's blocked:**
- `npm test` fails: `exact boundaries use the larger unit`. `formatBytes(1024)` returns `"1024 B"` and the test expects `"1.0 KiB"`. The loop in `src/index.js` uses `value > 1024`, so an exact 1024 never moves up a unit. The changelog and the test both describe the intended behavior, so the likely fix is `>=` in that loop. I didn't make it because it changes library behavior and that goes beyond release prep. I haven't tested that change.
- `docs/release-checklist.md` says `npm run build`, but `package.json` has no `build` script, so that step fails as written.

**Left alone:** I didn't commit, tag, push, or publish anything.

**To make it ready:** fix the boundary comparison (or drop the changelog claim if the behavior is intentional), then re-run `npm test`. Either remove the `npm run build` step from the checklist or add a build script.

STATUS: NOT_READY
VERIFIED: yes