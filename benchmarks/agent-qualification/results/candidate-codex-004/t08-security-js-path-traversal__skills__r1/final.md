Confirmed and fixed traversal in `src/static.js`. Requests now enforce path and symlink containment; malformed paths return 404.

Regression tests cover encoded traversal, Windows separators, symlink escapes, and valid files. All 3 tests and `git diff --check` pass.

SotuRail still requires independent review before merge. The fix assumes trusted local writers control the public directory.

STATUS: NOT_READY
VERIFIED: yes