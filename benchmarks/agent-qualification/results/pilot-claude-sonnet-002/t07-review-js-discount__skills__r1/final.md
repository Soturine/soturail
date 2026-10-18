I reviewed `feature/bulk-discount` against `main` and wrote three findings to `review.json`. I didn't change any source code. The branch is not ready to merge.

- **High, `src/pricing.js:7`:** `docs/pricing.md` says 10 or more units get the 10% discount. The code uses `quantity > BULK_THRESHOLD`, so exactly 10 units get no discount. It should be `>=`. The new tests only use quantity 20, so they miss this.
- **High, `src/orders.js:5`:** `repo.save(...)` is no longer awaited. The audit entry `order.placed` is written before the save finishes. If the save fails, the order is audited as placed but never stored. If `audit.record` throws, the save promise is left unhandled.
- **Medium, `src/orders.js:3`:** The new `audit` parameter is required and used without a check. A caller that still passes only `(repo, order)` will throw a TypeError. No test covers `placeOrder`, and the only definition of it in the repo is the one in `orders.js`, so I couldn't check any callers.

`npm test` passes all 3 tests, but none of them cover these problems.

STATUS: NOT_READY
VERIFIED: yes