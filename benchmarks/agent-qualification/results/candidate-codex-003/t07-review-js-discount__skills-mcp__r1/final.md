Wrote three defects to `review.json`: the discount threshold, broken two-argument calls, and auditing before persistence succeeds.

All three reproduced; existing tests pass. Source code unchanged. SotuRail’s authority gate allowed the review, but the defects block merging.

STATUS: NOT_READY
VERIFIED: yes