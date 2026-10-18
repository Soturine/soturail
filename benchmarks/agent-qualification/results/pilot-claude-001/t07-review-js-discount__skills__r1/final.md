I reviewed `feature/bulk-discount` against `main` and found three real defects. They are in `review.json`, and I didn't change any source code. I read the diff and `docs/pricing.md` but didn't run the tests.

1. **High, `src/pricing.js:7`:** the check is `quantity > BULK_THRESHOLD`, but `docs/pricing.md` says 10 or more units get the discount. Exactly 10 units miss it. The new tests only use a quantity of 20, so they don't catch this.
2. **High, `src/orders.js:5`:** `repo.save` is no longer awaited, but the docs say `placeOrder` resolves only after the order is persisted.
   - The audit entry is written before the save finishes, so a failed save still leaves an "order.placed" record.
   - If `audit.record` throws, the save promise is left unhandled.
3. **Medium, `src/orders.js:3`:** `audit` is a new required parameter with no default. A caller still passing two arguments saves the order, then fails on `audit.record` with a TypeError, so the call rejects even though the order was persisted. I found no such callers in the repo, so this affects outside code.

STATUS: NOT_READY
VERIFIED: no