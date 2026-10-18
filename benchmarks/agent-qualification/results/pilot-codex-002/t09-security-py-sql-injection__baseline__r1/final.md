Fixed SQL injection in user search and email lookup using bound parameters. Search now treats `%`, `_`, and backslashes literally.

All 6 tests pass, covering injection attempts, quoted input, literal searches, and role updates. `git diff --check` passed.

STATUS: READY
VERIFIED: yes