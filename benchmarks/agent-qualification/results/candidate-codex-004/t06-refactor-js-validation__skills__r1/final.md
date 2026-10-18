Extracted shared validation into `src/validation.js`, used by both handlers while preserving normalization, error order, partial updates, and status codes.

All 5 tests pass, including added behavior regression checks. `git diff --check` passes. Both checks were recorded through SotuRail.

STATUS: READY
VERIFIED: yes