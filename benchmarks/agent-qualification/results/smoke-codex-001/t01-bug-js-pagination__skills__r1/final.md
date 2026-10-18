Fixed pagination to round up the page count, preserving partial final pages. Added regression tests; all 5 tests pass after the fix (`37e48099`), and `git diff --check` passes.

SotuRail’s aggregate report remains stale/blocked because it includes the intentional pre-fix failure.

STATUS: READY
VERIFIED: yes