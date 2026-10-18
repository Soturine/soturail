The last partial page is now returned. `totalPages` used `Math.floor(totalItems / pageSize)`, which drops the final partial page. For example, 5 items at 2 per page gave 2 pages, so page 3 came back empty. I changed it to `Math.ceil` in `src/paginate.js`.

I also added three tests to `test/paginate.test.js`: a partial last page, a page past the end, and an empty result. `npm test` passes all 5 tests. I did not run the new tests against the old code to confirm they fail there. I did not commit anything.

`search()` calls `paginate`, so search results get the same fix.

STATUS: READY
VERIFIED: yes