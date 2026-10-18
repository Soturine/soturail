The last page of results now comes back when the result count isn't a multiple of the page size. The test suite passes (3/3).

**Cause:** `totalPages` in `src/paginate.js` used `Math.floor(totalItems / pageSize)`. For 5 items at 2 per page that gives 2 pages instead of 3, so `paginate` treated page 3 as out of range and returned an empty list.

**Fix:** Changed it to `Math.ceil`. I also added a regression test in `test/paginate.test.js` covering 5 items, page size 2, page 3, which should return `[5]` with `totalPages` 3. I did not run the new test against the old code to confirm it fails there. Nothing is committed.

STATUS: READY
VERIFIED: yes