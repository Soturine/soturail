I reviewed `feature/bulk-discount` against `main` and wrote four findings to `review.json`. I did not change any source files. The branch is not ready to merge.

The existing tests pass (3/3), but they miss every defect below. The tests use 20 units and never call `placeOrder`.

- **`src/orders.js:6` (high):** `repo.save` is no longer awaited. `docs/pricing.md` says `placeOrder` resolves only after the order is persisted, so this breaks the documented contract. A save failure also becomes an unhandled rejection while `audit.record` is awaited.
- **`src/orders.js:7` (high):** The `order.placed` audit event is recorded before the save completes, whatever its outcome. I confirmed with a failing repo that the event is still logged for an order that was never saved.
- **`src/pricing.js:8` (high):** The check is `quantity > 10`, but the docs say 10 or more units get the discount. A 10-unit line returns 10 instead of 9.
- **`src/orders.js:3` (medium):** The new `audit` parameter is required with no default, and no caller or test was updated. Two-argument callers will throw a `TypeError`.

I left out the version bump and the per-line versus per-SKU discount question. Neither is clearly a defect, and the code's per-line behaviour matches the doc's "on that line" wording.

STATUS: NOT_READY
VERIFIED: yes