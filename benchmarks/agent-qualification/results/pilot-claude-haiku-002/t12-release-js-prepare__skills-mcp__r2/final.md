Release 1.3.0 is prepared but not ready to publish. The test suite fails on the Unreleased fix, so I stopped short of anything that would ship it.

**Changes (uncommitted, in the working tree):**
- `package.json`: version `1.2.3` → `1.3.0`
- `src/version.js`: `VERSION` `1.2.3` → `1.3.0` (the version test checks this matches `package.json`, and it passes)
- `CHANGELOG.md`: the Unreleased entries (`decimals` option, exact-boundary fix) moved under `## [1.3.0] - 2026-10-18`, and `## [Unreleased]` is left empty above it.

No other file declares the version. I checked the repo for `1.2.3` outside `.soturail/`, and only these three matched.

**Blockers:**
1. **Failing test.** `npm test` runs 4 tests: 3 pass, 1 fails. `exact boundaries use the larger unit` expects `formatBytes(1024)` to return `1.0 KiB`, but the code returns `1024 B`. The cause is `src/index.js:9`, which uses `value > 1024`; the fix needs `>=`. The changelog claims this fix is done, but the code doesn't implement it. I didn't change the code or the test, since that would change behavior and would be lowering the gate. Either change `>` to `>=` (then the test should pass), or remove the "Fixed" entry if the fix isn't meant for this release.
2. **Missing build script.** `docs/release-checklist.md` says to run `npm run build`, but `package.json` has no `build` script. Either add one or update the checklist.

**Not done:** I didn't commit, tag, push or publish. I also didn't run the SotuRail `release.preflight`/`governance.evaluate` gates; the release checks above ran directly with `npm test` and grep, so the evidence is only that run.

STATUS: NOT_READY
VERIFIED: yes