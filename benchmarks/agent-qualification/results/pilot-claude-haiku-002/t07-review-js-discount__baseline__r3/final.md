I reviewed `feature/bulk-discount` against `main`, found four defects, and wrote them to `review.json` at the repo root. I did not modify any source files.

The existing test suite passes (3/3), but it doesn't cover the cases below.

Findings:
- **`src/pricing.js:6` (high):** The check is `quantity > 10`, but `docs/pricing.md` says 10 or more units get the discount. A quantity of exactly 10 is not discounted (`orderTotal([{unitPrice:1,quantity:10}])` returns 10, expected 9).
- **`src/orders.js:5` (high):** `repo.save` is no longer awaited. That breaks the documented rule that `placeOrder` resolves only after persistence, and a rejected save can surface as an unhandled rejection while the audit await runs.
- **`src/orders.js:6` (high):** The `order.placed` audit entry is written before the save outcome is known. I reproduced this: with a save that throws `db down`, the audit still logged the order as placed.
- **`src/orders.js:3` (medium):** The new required `audit` parameter has no default. Two-argument callers crash with a TypeError after the save has already started, so the order can be persisted while the call reports failure. No callers exist in this repo, so this is an API break for external callers.

I did not run a `placeOrder` check for the audit-throws path or any test for the exact-10 boundary; those are inferred from the code and docs, though the first two behaviors were reproduced.

STATUS: NOT_READY
VERIFIED: yes