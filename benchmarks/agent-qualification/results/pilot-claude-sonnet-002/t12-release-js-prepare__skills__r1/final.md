Release 1.3.0 is prepared but not ready to publish: one test fails.

**What I changed**
- `package.json` and `src/version.js` now say `1.3.0`. I found no other place that declares the package version. The `0.1.0` in `examples/mcp/initialize.json` is a sample client version, so I left it.
- In `CHANGELOG.md` I added a dated `## [1.3.0] - 2026-10-18` heading. The `Added` and `Fixed` entries now sit under it, and `[Unreleased]` is empty.

**Blocker**
- `npm test` fails on "exact boundaries use the larger unit". `formatBytes(1024)` returns `1024 B`, but the test expects `1.0 KiB`.
- The cause is `while (value > 1024 …)` in `src/index.js`. It needs `>=`.
- The changelog's "Fixed" entry for this behavior is therefore not true of the current code.
- I didn't change the code, since you asked only for release prep. Changing `>` to `>=` should fix it. Tell me if you want me to make that change and re-run the tests.

**Not checked**
- `docs/release-checklist.md` also lists `npm run build`, but `package.json` has no build script.
- I didn't run the SotuRail `release.preflight`, `evidence.verify` or `governance.evaluate` gates.
- I haven't seen CI results for this commit.

I did not commit, tag, push or publish anything.

STATUS: NOT_READY
VERIFIED: yes