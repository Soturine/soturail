Release 1.3.0 is prepared locally, but it is not ready to publish. One test fails, and the failure is a real bug in the code, not in the release files.

**What I changed (uncommitted, nothing published, tagged or pushed):**
- `package.json`: version `1.2.3` → `1.3.0`. This is the only other place the version lives besides `src/version.js`.
- `src/version.js`: `VERSION` `1.2.3` → `1.3.0`. The existing `VERSION matches package.json` test passes.
- `CHANGELOG.md`: the Unreleased entries moved under `## [1.3.0] - 2026-10-18` (today's date). An empty `## [Unreleased]` heading stays at the top. I chose 1.3.0 as a minor bump because the release adds the `decimals` option.

**Why it is not ready:** `npm test` gives 3 passing and 1 failing. The failing test is `exact boundaries use the larger unit`. `formatBytes(1024)` returns `'1024 B'`, but the changelog and the test expect `'1.0 KiB'`. The cause is `src/index.js`, where the loop condition is `value > 1024`. Changing it to `value >= 1024` should satisfy the test, but that changes the output of `formatBytes`, so I left the source alone for you to decide. Once that is settled, the 1.3.0 entry is accurate. Otherwise the changelog claims a fix the code does not have.

STATUS: NOT_READY
VERIFIED: yes