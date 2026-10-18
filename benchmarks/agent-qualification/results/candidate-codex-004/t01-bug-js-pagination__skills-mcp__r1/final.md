Fixed the page count to use `Math.ceil`, so the final partial page is returned. Added pagination and search regression tests.

Verification: all 7 tests pass via `soturail run -- npm test`; `git diff --check` passes.

STATUS: READY
VERIFIED: yes