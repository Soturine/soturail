The last partial page now comes back. The cause was in `totalPages` in `src/paginate.js`: it used `Math.floor(totalItems / pageSize)`, so a partial final page was not counted and `paginate` returned empty items for it. I changed it to `Math.ceil`.

I also added two tests to `test/paginate.test.js`:
- A 5-item list with page size 2 returns `[5]` on page 3, with `totalPages` 3.
- Requesting page 4 of that same list returns no items.

`npm test` passes all 4 tests, including the two new ones. I did not commit anything.

STATUS: READY
VERIFIED: yes