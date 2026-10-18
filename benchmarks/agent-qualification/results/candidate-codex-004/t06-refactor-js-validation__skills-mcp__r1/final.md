Extracted shared validation into `src/validation.js` and updated both handlers to use it, preserving normalization, error order, and partial-update behavior.

All 5 tests pass, including added regression coverage. `git diff --check` passes. Checks were recorded through SotuRail.

STATUS: READY
VERIFIED: yes