Fixed SQL injection in both user lookups using bound parameters. Search now handles `%`, `_`, and backslashes literally.

All 8 tests pass, covering injection attempts, quoted input, search behavior, and role updates. `git diff --check` also passes.

STATUS: READY
VERIFIED: yes