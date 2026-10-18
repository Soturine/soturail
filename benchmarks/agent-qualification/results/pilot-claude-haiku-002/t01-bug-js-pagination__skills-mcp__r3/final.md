The last page of results is now included when the total isn't a multiple of the page size. The fix is one line in `src/paginate.js`.

**Cause:** `totalPages` used `Math.floor(totalItems / pageSize)`, so a partial last page was never counted. For example, 5 items at 2 per page gave 2 pages, and the 5th item was unreachable. The bound check in `paginate` uses `totalPages`, so it rejected page 3 as out of range.

**Change:**
- `src/paginate.js`: `Math.floor` → `Math.ceil`.
- `test/paginate.test.js`: added a regression test that pages through `[1, 2, 3, 4, 5]` with page size 2 and expects page 3 to return `[5]` with `totalPages` 3.

**Verification:** `node --test test/paginate.test.js` passes all 3 tests. I didn't run the full suite as a directory. `node --test test/` failed here because this Node version treats the directory as a file, so that failure comes from the command, not the code. `src/search.js` also goes through `paginate`, so it gets the same fix, but I didn't add a search-level test.

STATUS: READY
VERIFIED: yes