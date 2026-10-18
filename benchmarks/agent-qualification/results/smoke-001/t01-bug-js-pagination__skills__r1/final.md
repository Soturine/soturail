The last page now shows up when the result count isn't a multiple of the page size. `totalPages` in `src/paginate.js` used `Math.floor`, so the partial last page was dropped and out-of-range checks rejected it. I changed it to `Math.ceil`.

I added a regression test in `test/paginate.test.js`: 5 items at page size 2 now return `[5]` on page 3, with 3 total pages. All 3 tests pass with `node --test`.

STATUS: READY
VERIFIED: yes