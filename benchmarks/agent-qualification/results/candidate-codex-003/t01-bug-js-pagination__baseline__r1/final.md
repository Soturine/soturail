Fixed pagination to round up the page count, keeping partial final pages accessible.

Added regression coverage for partial pages, small result sets, empty results, and out-of-range pages. All 6 tests pass; `git diff --check` passes.

STATUS: READY
VERIFIED: yes