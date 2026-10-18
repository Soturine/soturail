Fixed pagination to round up the page count, making partially filled final pages accessible.

Added regression coverage for pagination and search. All 6 tests pass; `git diff --check` passes.

STATUS: READY
VERIFIED: yes