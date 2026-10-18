I fixed it: the last partial page now shows up in search results. All 4 tests pass.

**Cause:** `totalPages` in `src/paginate.js` used `Math.floor`. With 5 results and a page size of 2, that gave 2 pages instead of 3. `paginate` then treated page 3 as out of range and returned an empty list.

**Fix:** I changed `Math.floor` to `Math.ceil`. An empty result still gives `totalPages: 0`, as the README says.

**Tests:** I added two to `test/paginate.test.js`. One checks that page 3 of 5 items at size 2 returns `[5]` with 3 pages. The other checks that an empty list has 0 pages.

STATUS: READY
VERIFIED: yes