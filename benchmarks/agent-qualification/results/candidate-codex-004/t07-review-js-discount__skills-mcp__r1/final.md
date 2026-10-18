Wrote three confirmed defects to `review.json`: the quantity-10 discount boundary, broken two-argument `placeOrder` calls, and premature audit events.

Existing tests pass; targeted checks reproduce all three defects. Source code is unchanged.

STATUS: NOT_READY
VERIFIED: yes