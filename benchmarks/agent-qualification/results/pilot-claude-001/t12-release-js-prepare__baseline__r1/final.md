Release 1.3.0 is prepared and ready to publish. All 4 tests pass, and I ran them after my last change.

- **Version:** I bumped 1.2.3 to 1.3.0 in `package.json` and `src/version.js`. Those were the only two places it appeared.
- **Changelog:** The Unreleased entries now sit under `## [1.3.0] - 2026-10-18`. I left an empty `[Unreleased]` heading above it.
- **Bug fix (not just a bump):** The changelog says exact unit boundaries show in the larger unit, but the code didn't do that. `formatBytes(1024)` returned `1024 B`, and the existing boundary test failed. The loop in `src/index.js` used `value > 1024`. I changed it to `>=`, and the test now passes.
- **Not done:** I didn't commit, tag, publish or push anything. The four changed files are uncommitted.

STATUS: READY
VERIFIED: yes