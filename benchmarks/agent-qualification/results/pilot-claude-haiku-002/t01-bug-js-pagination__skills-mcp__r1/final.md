The last partial page is now returned. The fix was one line: `totalPages` in `src/paginate.js` used `Math.floor`, so a list that didn't divide evenly lost its final page. It now uses `Math.ceil`, which also matches the README's `totalPages: 0` for an empty result.

I added two tests to `test/paginate.test.js`: a 5-item list with page size 2 whose page 3 returns `[5]` with 3 total pages, and an empty list that reports 0 pages. All 4 tests in that file pass.

Running `node --test test/` on the directory fails in this environment before any test runs, so I ran the file directly. I did not run the search path (`src/search.js`), which calls `paginate` but has no tests of its own.

STATUS: READY
VERIFIED: yes