The last partial page is now returned. The cause was `totalPages` in `src/paginate.js` using `Math.floor`, which dropped the final partial page. For example, 5 items at page size 2 reported 2 pages, so page 3 (item 5) came back empty. I changed it to `Math.ceil`, which also keeps an empty list at 0 pages, as the README specifies.

I added three regression tests to `test/paginate.test.js`: a partial last page, an empty list, and a page past the end. `npm test` passes all 5 tests. I did not run the new tests against the old code to confirm they fail there. Nothing is committed.

STATUS: READY
VERIFIED: yes