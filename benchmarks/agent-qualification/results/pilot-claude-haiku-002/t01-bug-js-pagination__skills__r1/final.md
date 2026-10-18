The last page of results is now included when the total isn't a multiple of the page size. The cause was `totalPages` in `src/paginate.js`, which used `Math.floor`. With 5 items and a page size of 2, it reported 2 pages, so page 3 (the item `5`) returned empty. I changed it to `Math.ceil`.

I also added two tests to `test/paginate.test.js`: one for a partial last page (5 items, page size 2, page 3 returns `[5]` with 3 total pages) and one for an empty list (0 pages). All 4 tests in that file pass. I didn't run the new partial-page test against the old code to confirm it fails there. `node --test test/` fails on this Node version (v24) because it tries to load the directory as a module, so I ran the file directly.

STATUS: READY
VERIFIED: yes