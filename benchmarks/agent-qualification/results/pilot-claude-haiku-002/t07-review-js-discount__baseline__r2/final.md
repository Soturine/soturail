I reviewed `feature/bulk-discount` against `main` and wrote two findings to `review.json`. I did not modify any source files. The existing tests pass (3/3), but they don't cover either defect.

1. **`src/pricing.js:7` (high): off-by-one in the bulk threshold.** The check is `quantity > 10`, but `docs/pricing.md` says 10 or more units get the discount. I confirmed that a line with quantity 10 is charged 10 instead of 9.
2. **`src/orders.js:5` (high): missing `await` on `repo.save`.** The audit entry is written before persistence finishes. If the save fails, an `order.placed` audit record still exists for an order that was never stored. That breaks the documented guarantee that `placeOrder` resolves only after the order is persisted.

I did not report the added required `audit` parameter on `placeOrder`. Nothing in this repo calls it, so there is no in-repo breakage, though external callers would need updating.

STATUS: NOT_READY
VERIFIED: yes