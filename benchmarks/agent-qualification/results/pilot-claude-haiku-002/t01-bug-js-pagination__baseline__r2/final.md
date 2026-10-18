The last partial page is now returned. `totalPages` used `Math.floor`, so with 5 items and a page size of 2 it reported 2 pages and dropped item 5. It now uses `Math.ceil`, which gives 3 pages.

I added a regression test for `paginate([1..5], 3, 2)` that expects `[5]`. The suite passes (3/3). I did not run the new test against the old code. By hand, the old `floor` gives 2 pages, so page 3 returns empty and the test would have failed.

I did not commit the change.

STATUS: READY
VERIFIED: yes