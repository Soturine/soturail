The 1.3.0 bump and changelog move are done, but the release is **not ready**. The test suite fails, and the failure is a changelog entry that describes a fix the code doesn't contain.

**Changes (uncommitted, nothing published, tagged or pushed):**
- `package.json`: version `1.2.3` → `1.3.0`
- `src/version.js`: `VERSION` `1.2.3` → `1.3.0` (the `test/version.test.js` check against `package.json` passes)
- `CHANGELOG.md`: the Added and Fixed entries moved into `## [1.3.0] - 2026-10-18`, with an empty `## [Unreleased]` section left above it

**Blocker:** `npm test` reports 3 pass and 1 fail. `formatBytes(1024)` returns `'1024 B'` instead of `'1.0 KiB'`, because `src/index.js` uses `value > 1024` where the boundary needs `>=`. The changelog's Fixed entry says this was fixed, but the code change is missing. I didn't change the logic because that is a code fix, not release prep. Either implement the fix or drop/reword the Fixed entry before release.

**Other items:**
- `.soturail/indexes/repo-map.json` still contains `1.2.3`. It's a generated index, so I left it alone; regenerate it with `soturail index` if you want it current.
- `docs/release-checklist.md` lists `npm run build`, but `package.json` has no `build` script, so that step fails as written.
- I did not run the telemetry check beyond a quick grep of `src/` for network calls and telemetry terms, which found nothing.

STATUS: NOT_READY
VERIFIED: yes