Fixed pagination to round page counts up with `Math.ceil`, preserving the final partial page. Added regression coverage; all 5 tests and `git diff --check` pass.

SotuRail’s aggregate evidence still flags the intentional pre-fix test failure; the post-fix test run passed (`753f7eb2`).

STATUS: READY
VERIFIED: yes