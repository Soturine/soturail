Fixed SQL injection in both lookups in [directory/users.py](directory/users.py), and escaped wildcard characters for literal name searches.

All seven tests passed after the code changes. SotuRail still reports stale evidence and requires independent review, so production readiness remains blocked.

STATUS: NOT_READY
VERIFIED: yes