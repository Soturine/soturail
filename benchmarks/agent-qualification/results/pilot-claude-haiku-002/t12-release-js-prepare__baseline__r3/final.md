Release 1.3.0 is prepared, but it is not ready to publish: the test suite fails on the Unreleased "exact boundaries" fix.

**What I changed (uncommitted, nothing published, tagged or pushed):**
- `package.json`: version `1.2.3` → `1.3.0`.
- `src/version.js`: `VERSION` `1.2.3` → `1.3.0`. `test/version.test.js` checks this against `package.json`, and that check passes.
- `CHANGELOG.md`: the `decimals` and boundary entries moved under `## [1.3.0] - 2026-10-18`, with an empty `## [Unreleased]` heading left above it.

No other `1.2.3` references remain in tracked files.

**Why it's blocked:** `npm test` gives 3 passing and 1 failing (`test/format.test.js:13`):
- The changelog says exact unit boundaries now use the larger unit.
- `formatBytes` in `src/index.js` still uses `while (value > 1024 ...)`, so `formatBytes(1024)` returns `'1024 B'` instead of `'1.0 KiB'`.
- The likely fix is changing `>` to `>=` in that loop. I didn't make it, because it's a library behaviour change outside a version bump. Check it against the 1023/1024 cases before you ship.

**Options:** I can make that one-character fix and re-run the tests, or you can make it yourself. If you want it, I can also commit the release prep with the `Co-Authored-By` line.

STATUS: NOT_READY
VERIFIED: yes