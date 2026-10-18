The last page now shows up when the result count isn't a multiple of the page size. The cause was in `src/paginate.js`: `totalPages` used `Math.floor`, which dropped the partial final page. I changed it to `Math.ceil`.

I added a regression test: 5 items at page size 2 now give 3 pages, and page 3 returns `[5]`. All 3 tests pass, including the 2 that were already there. I didn't change anything else.

STATUS: READY
VERIFIED: yes