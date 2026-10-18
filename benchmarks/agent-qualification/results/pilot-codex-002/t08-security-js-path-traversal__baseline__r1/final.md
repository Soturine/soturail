Fixed the traversal vulnerability with directory boundary and symlink destination checks. Malformed URL encoding now returns a controlled error.

All 6 tests pass, covering traversal attempts, symlink escapes, malformed input, and valid assets. `git diff --check` passes.

STATUS: READY
VERIFIED: yes