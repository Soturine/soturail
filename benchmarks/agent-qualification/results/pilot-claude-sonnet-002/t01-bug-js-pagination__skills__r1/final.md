The last page now shows up when the result count isn't a multiple of the page size. The bug was in `totalPages` in `src/paginate.js`, which rounded down (`Math.floor`). With 5 results and a page size of 2, it reported 2 pages, so page 3 came back empty. It now rounds up (`Math.ceil`).

I added a regression test for the 5-items, page-size-2 case in `test/paginate.test.js`. All 3 tests pass.

STATUS: READY
VERIFIED: yes