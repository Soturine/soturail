The last page now shows up when the result count isn't a multiple of the page size. The bug was in `totalPages` in `src/paginate.js`, which rounded down instead of up. For 5 results at 2 per page it reported 2 pages, so page 3 came back empty. I changed `Math.floor` to `Math.ceil`.

I added a regression test in `test/paginate.test.js` that requests page 3 of 5 items at 2 per page. All 3 tests pass with `node --test`.

STATUS: READY
VERIFIED: yes