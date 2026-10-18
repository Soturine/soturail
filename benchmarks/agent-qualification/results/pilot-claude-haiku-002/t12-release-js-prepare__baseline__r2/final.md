Release 1.3.0 is prepared but not ready to publish: the test suite fails on the boundary fix that the changelog claims.

**Changes made (uncommitted):**
- `package.json` and `src/version.js` bumped from `1.2.3` to `1.3.0`. The `VERSION matches package.json` test passes.
- `CHANGELOG.md`: the Unreleased entries now sit under `## [1.3.0] - 2026-10-18` (today's date), with an empty `## [Unreleased]` header above. The `1.2.3` history is untouched.

**Blocking issue:** `test/format.test.js` fails on "exact boundaries use the larger unit". `formatBytes(1024)` returns `'1024 B'` instead of `'1.0 KiB'`. The cause is `src/index.js`: the loop condition is `value > 1024`, so an exact 1024 never leaves the byte unit. The Fixed entry describes a change that isn't in the code. Changing `>` to `>=` in that loop should make the test pass, but that's a behaviour change I didn't make without your say-so. Note that the fix would also change results for other exact multiples, so check that's what you want.

**Next steps for you:**
1. Decide on the boundary fix. If you want it in 1.3.0, make the one-character change and re-run `npm test`.
2. If you'd rather drop it, remove that line from the 1.3.0 Fixed section.
3. Commit, tag and publish when you're ready. I haven't done any of those.

I didn't publish, tag, commit or push anything.

**Verification:** after my last edit I re-ran `npm test`: 4 tests, 3 pass, 1 fails (the boundary test). The only remaining `1.2.3` reference is the historical changelog heading, which is correct to keep.

STATUS: NOT_READY
VERIFIED: yes