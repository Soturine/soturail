The last page now shows up. `totalPages` in `src/paginate.js` rounded down with `Math.floor`, so a partial last page wasn't counted and `paginate` returned an empty result for it. I changed it to `Math.ceil`. `search.js` goes through `paginate`, so it's fixed there too.

I added a regression test: 5 items with a page size of 2 now give a third page containing `[5]` and `totalPages` of 3. All 3 tests pass with `node --test`.

STATUS: READY
VERIFIED: yes