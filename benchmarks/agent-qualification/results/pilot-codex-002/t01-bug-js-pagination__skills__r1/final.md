Fixed pagination to round up with `Math.ceil`, preserving the final partial page.

Added regression coverage; all 5 tests and `git diff --check` pass. SotuRail’s aggregate evidence remains stale because it includes the pre-fix failure and generated state changes.

STATUS: READY
VERIFIED: yes