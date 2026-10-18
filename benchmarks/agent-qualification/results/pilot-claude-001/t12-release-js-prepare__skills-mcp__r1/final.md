Release 1.3.0 is prepared but not ready to publish, because `npm test` fails.

**What I changed (nothing committed, tagged, pushed or published):**
- `package.json` and `src/version.js` now say `1.3.0`. These are the only two places the version is declared. `test/version.test.js` checks that they match.
- In `CHANGELOG.md`, the Unreleased entries now sit under `## [1.3.0] - 2026-10-18`, with an empty `[Unreleased]` heading left above it.

**Why it isn't ready:**
- `npm test` fails on "exact boundaries use the larger unit": `formatBytes(1024)` returns `'1024 B'` and the test expects `'1.0 KiB'`.
- The 1.3.0 changelog lists this as a fix ("Exact unit boundaries … are now shown in the larger unit"), but the code doesn't do it. `src/index.js` loops on `while (value > 1024 …)`, and it should be `>=`.
- I didn't change the code, since you asked only for the version bump and changelog. Changing `>` to `>=` should fix it. Alternatively, drop the Fixed entry from the changelog.

**Other gaps:**
- `docs/release-checklist.md` lists `npm run build`, but `package.json` has no build script.
- I didn't run the soturail preflight, evidence or governance gates, and I didn't check CI.

STATUS: NOT_READY
VERIFIED: yes