Confirmed and fixed the traversal leak in `src/static.js`. Decoded paths and symlink targets now stay within the public root; malformed URLs return 404.

All three tests pass after the final change (`3f10805f`). Coverage includes traversal, symlink escapes, and valid public files.

SotuRail requires independent review before merge. The public filesystem must remain trusted against concurrent malicious modification.

STATUS: NOT_READY
VERIFIED: yes