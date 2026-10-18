The last page is now returned for uneven result counts. The bug was `totalPages` in `src/paginate.js` using `Math.floor`, which dropped the partial final page. With 5 items and page size 2, it reported 2 pages, so page 3 came back empty. It now uses `Math.ceil`.

An empty result still reports 0 pages, as the README specifies. I also added a regression test in `test/paginate.test.js` for 5 items at page size 2, requesting page 3, which expects `[5]` and 3 pages. That test would fail on the old code. All 3 tests pass. I ran only the paginate test file, since it's the only test file in the repo. I haven't committed the change.

STATUS: READY
VERIFIED: yes