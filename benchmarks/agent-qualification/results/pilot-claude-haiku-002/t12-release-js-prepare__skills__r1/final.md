The release is prepared at 1.3.0, but it is not ready to publish: the test suite fails on the one behavior the Unreleased changelog claims is fixed.

**Changes made (uncommitted):**
- `package.json`: version `1.2.3` → `1.3.0`.
- `src/version.js`: `VERSION` `1.2.3` → `1.3.0`. The existing `VERSION matches package.json` test ties these two together.
- `CHANGELOG.md`: the `decimals` and boundary-fix entries moved under `## [1.3.0] - 2026-10-18`, with `[Unreleased]` left empty above it.

I left the `examples/skills/*.yml` versions alone because they version those skill files, not this package. The only remaining `1.2.3` reference is the historical changelog heading.

**Blocker:** `npm test` gives 3 pass, 1 fail, both before and after the bump. The failing test is `exact boundaries use the larger unit`. `formatBytes(1024)` returns `'1024 B'` instead of `'1.0 KiB'`, because the loop in `src/index.js:9` uses `value > 1024` where `>=` is needed. The changelog's Fixed entry describes a fix that isn't in the code. I didn't change the library behavior or the test without your go-ahead. If you want the fix in 1.3.0, changing `>` to `>=` on that line is the likely fix, and I can apply it and re-run the suite.

**Other issue:** `docs/release-checklist.md` tells you to run `npm run build`, but `package.json` has no `build` script. Either the step should be removed or a build script added.

I did not commit, tag, push, or publish anything.

STATUS: NOT_READY
VERIFIED: yes