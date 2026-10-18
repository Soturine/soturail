I reviewed `feature/bulk-discount` against `main` and wrote two findings to `review.json`. I did not modify any source code.

**Findings**

1. **`src/pricing.js:7` (high):** The bulk check is `line.quantity > BULK_THRESHOLD`, which is strict. `docs/pricing.md` says "10 or more units", so a line with exactly 10 units gets no discount. I confirmed this by running `orderTotal([{unitPrice:1, quantity:10}])`, which returns 10 instead of 9. The new tests use 20 units, so they miss this boundary.
2. **`src/orders.js:5` (high):** `repo.save()` is no longer awaited. `docs/pricing.md` says `placeOrder` resolves only after persistence, so this breaks that contract. A save failure becomes an unhandled rejection instead of reaching the caller, and `order.placed` is audited even when the save never completes.

**Not reported:** `placeOrder` now takes a required `audit` parameter. Nothing in the repo calls it, so I could not confirm a breakage, and I left it out because it is speculative. You may want to check external callers.

**Verification:** The existing suite passes (3/3), but it has no coverage for `placeOrder` and no test at the 10-unit boundary, which is why these defects get through. I did not add tests, since you asked for no source changes.

STATUS: NOT_READY
VERIFIED: yes