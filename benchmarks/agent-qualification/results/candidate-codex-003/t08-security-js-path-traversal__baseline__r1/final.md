Fixed the confirmed path traversal vulnerability. The endpoint now checks path containment, blocks symlink escapes, and safely returns 404 for malformed paths.

All five tests pass, covering normal files, traversal attempts, malformed encoding, and symlink escapes. `git diff --check` also passes.

STATUS: READY
VERIFIED: yes