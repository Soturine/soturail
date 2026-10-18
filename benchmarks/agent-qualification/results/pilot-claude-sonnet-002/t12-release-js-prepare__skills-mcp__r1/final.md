The release prep is done, but 1.3.0 is not ready to publish because one test fails.

**Changed**
- `package.json` and `src/version.js` now say `1.3.0`. These were the only two places the version is declared in the repo, and `test/version.test.js` checks that they match.
- `CHANGELOG.md` now has a `## [1.3.0] - 2026-10-18` section holding the former Unreleased entries. `[Unreleased]` is left empty above it.

**Blocker**
- `npm test` gives 3 passing and 1 failing. The failing check expects `formatBytes(1024)` to return `1.0 KiB` but gets `1024 B`.
- The cause is `src/index.js:10`, where the loop reads `while (value > 1024 ...)`. It should be `>=`. The 1.3.0 changelog lists this boundary fix under Fixed, but the code doesn't contain it. Publishing now would ship a changelog that describes behavior the package doesn't have.
- I didn't change the code, since you asked for release prep only. The fix is a one-character edit. Do you want me to make it and re-run the tests?

**Other gaps**
- `docs/release-checklist.md` lists `npm run build`, but `package.json` has no build script.
- I didn't run the evidence, contract or governance gates, and I can't confirm CI for this commit.
- Nothing was committed, tagged, pushed or published. The changes are uncommitted in the working tree.

STATUS: NOT_READY
VERIFIED: yes