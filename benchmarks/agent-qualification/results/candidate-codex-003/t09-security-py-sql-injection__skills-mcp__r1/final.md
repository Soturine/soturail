Fixed SQL injection in both user lookup functions and escaped search wildcards for literal matching. Added security regression coverage; all nine tests and `git diff --check` passed after the changes.

SotuRail verified check evidence, but its readiness gate still requires acceptance-criterion evidence binding and an independent review attestation.

STATUS: NOT_READY
VERIFIED: yes