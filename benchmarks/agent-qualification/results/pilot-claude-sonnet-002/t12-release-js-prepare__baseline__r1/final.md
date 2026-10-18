Release 1.3.0 is prepared, but it is not ready to publish: one test fails because the code doesn't match the changelog.

**Done**
- Version `1.3.0` is set in `package.json` and `src/version.js`. Those are the only two places it was declared. `test/version.test.js` checks that they match.
- The Unreleased entries (the `decimals` option and the boundary fix) are now under `## [1.3.0] - 2026-10-18`, with an empty `[Unreleased]` heading left above.

**Blocker**
`npm test` fails on "exact boundaries use the larger unit". `formatBytes(1024)` returns `"1024 B"` instead of `"1.0 KiB"`. The loop condition at `src/index.js:9` is `value > 1024`. It should be `>=`, which would make the "exact unit boundaries" fix listed in the changelog true.

I left the source alone because you asked for release prep only. The fix is a one-character change. Say so if you want me to make it and re-run the tests. Nothing was committed, tagged, pushed or published.

STATUS: NOT_READY
VERIFIED: yes