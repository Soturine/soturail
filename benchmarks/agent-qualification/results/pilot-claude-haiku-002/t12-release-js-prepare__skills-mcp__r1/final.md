The 1.3.0 bump and changelog move are done, but the release is **not ready**. The test suite fails on a fix the changelog claims.

**Changes made (uncommitted):**
- `package.json` and `src/version.js`: version `1.2.3` → `1.3.0`. These are the only two places the version is declared.
- `CHANGELOG.md`: the Unreleased entries (`decimals` option, exact-boundary fix) now sit under `## [1.3.0] - 2026-10-18`. An empty `## [Unreleased]` heading remains at the top.

**Why it's not ready:**
- `npm test` fails 1 of 4. `exact boundaries use the larger unit` gets `'1024 B'` where it expects `'1.0 KiB'`. The cause is `src/index.js`: the loop uses `while (value > 1024 ...)`, so a value exactly equal to 1024 is never promoted. `formatBytes(1048576)` also returns `1024.0 KiB` instead of `1.0 MiB`. The changelog says this is fixed, and it isn't. The failure was already there before my edits.
- The fix is likely a one-character change to `>=`, but I did not apply it. It changes behavior and is outside a version bump. I haven't tested it.
- `docs/release-checklist.md` tells you to run `npm run build`, but `package.json` has no `build` script. Either add one or update the checklist.

**Not done, as requested:** nothing was published, tagged, pushed, or committed.

**Verification:** I ran `npm test` after the last edit. It passes the VERSION-matches-package.json check and fails the boundary test, as described above.

STATUS: NOT_READY
VERIFIED: yes