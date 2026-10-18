Fixed SQL injection in both user lookups using bound parameters and made name wildcards literal. Added regression coverage; all six tests and `git diff --check` pass after the final change.

Release remains blocked by SotuRail’s stale evidence, bytecode scope findings, and required independent review.

STATUS: NOT_READY
VERIFIED: yes