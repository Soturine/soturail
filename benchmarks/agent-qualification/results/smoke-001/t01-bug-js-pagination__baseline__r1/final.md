The last page no longer goes missing. `totalPages` in `src/paginate.js` used `Math.floor`, which dropped the final partial page, and I changed it to `Math.ceil`. With 5 items and a page size of 2, there are now 3 pages and page 3 returns `[5]`.

I added a regression test for that case in `test/paginate.test.js`. The test suite passes (3 tests).

STATUS: READY
VERIFIED: yes