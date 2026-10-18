Fixed the confirmed path traversal vulnerability. The endpoint now checks resolved paths and symbolic-link destinations stay within the public directory. Malformed URL encoding returns 400.

All five tests pass, covering traversal attempts, symlink escapes, and normal file serving. `git diff --check` passes.

STATUS: READY
VERIFIED: yes