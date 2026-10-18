Fixed the root cause in `src/merge.js`: a shallow copy followed by `Object.assign` mutated shared defaults, letting Acme’s settings leak into later tenant requests.

Merges now copy nested objects and arrays from both inputs. Added regressions reproduced the failure before the fix; all four tests pass afterward, along with `git diff --check`.

SotuRail’s readiness gate still requires independent review before merging.

STATUS: NOT_READY
VERIFIED: yes