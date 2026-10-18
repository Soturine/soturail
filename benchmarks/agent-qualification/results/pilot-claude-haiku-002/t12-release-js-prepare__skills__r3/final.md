Release 1.3.0 is prepared in the working tree, but it is not ready to publish. The test suite fails on the boundary fix the changelog claims. I haven't committed, tagged, pushed or published anything.

**Changes**
- `package.json` and `src/version.js` now say `1.3.0`. These are the only two version declarations, and the `VERSION matches package.json` test covers them. No `1.2.3` references remain except the historical 1.2.3 changelog heading.
- `CHANGELOG.md`: the Unreleased entries moved under `## [1.3.0] - 2026-10-18`, and Unreleased is now empty.

**Blockers**
1. **Failing test:** `exact boundaries use the larger unit` fails. `formatBytes(1024)` returns `1024 B` because `src/index.js` uses `value > 1024`, not `>=`. The changelog says this is fixed, so the 1.3.0 notes are inaccurate until the code changes. I didn't edit the library code, since that goes beyond release prep. The fix is a one-character change, if you want it in this release.
2. **Missing build script:** `docs/release-checklist.md` lists `npm run build`, but `package.json` only defines `test`.

**Test results:** after the edits, 4 tests run, 3 pass, 1 fails (the boundary test above).

The SotuRail release tools (`release.preflight`, `evidence.verify`, `governance.evaluate`) aren't available in this session, so I ran equivalent checks by hand: version consistency, changelog, and tests. I didn't run CI, package-contents or provenance checks.

Once the boundary fix lands (or the changelog entry is removed) and the build-script question is settled, the release can be re-checked.

STATUS: NOT_READY
VERIFIED: yes