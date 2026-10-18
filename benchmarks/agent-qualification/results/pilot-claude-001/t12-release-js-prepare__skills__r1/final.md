Version 1.3.0 is bumped and the changelog is dated, but it is not ready to publish. One test fails, and I didn't publish, tag or push anything.

**Changes made**
- `package.json`: version is now `1.3.0`.
- `src/version.js`: `VERSION` is now `"1.3.0"`.
- `CHANGELOG.md`: the Unreleased entries now sit under `## [1.3.0] - 2026-10-18`, with an empty `[Unreleased]` heading above them.
- I left `.soturail/indexes/repo-map.json` alone. It is a generated index that still quotes `1.2.3`, so regenerate it with the SotuRail tooling if you want it current.

**Blocker**
- `npm test` fails in `test/format.test.js:14`. `formatBytes(1024)` returns `'1024 B'` but the test expects `'1.0 KiB'`.
- The changelog lists "Exact unit boundaries … now shown in the larger unit" under Fixed, but `src/index.js` doesn't implement it. The loop condition is `while (value > 1024 …)`, and it needs `>=`.
- I didn't change the code, since you asked for a release prep rather than a fix. Once that is fixed, re-run the tests.

I didn't run the other release gates (SotuRail preflight, evidence and governance checks, CI for the exact commit). The checklist's `npm run build` step doesn't apply, because there is no build script. The changes are also uncommitted.

STATUS: NOT_READY
VERIFIED: yes