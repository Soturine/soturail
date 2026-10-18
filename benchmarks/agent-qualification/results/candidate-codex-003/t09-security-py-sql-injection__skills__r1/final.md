Fixed SQL injection in both lookups in [directory/users.py](directory/users.py), and escaped search wildcards to preserve literal substring matching.

All 7 tests pass, including injection payloads, quoted values, wildcard searches, and role constraints. SotuRail evidence verification passed. Its readiness gate still requires independent review before merge or release.

STATUS: NOT_READY
VERIFIED: yes