Fixed pagination to round up the page count, preserving the final partial page.

Added regression coverage for partial pages and search results. All 6 tests pass via `soturail run -- npm test` (record `bbcca682`); `git diff --check` passes.

STATUS: READY
VERIFIED: yes