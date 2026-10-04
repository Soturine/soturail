---
name: soturail-debug
description: "Diagnose a failure in a SotuRail repository from recorded evidence: reproduce it with a recorded command, inspect redacted raw logs, narrow the cause through guarded reads and confirm the fix with the same check. Use for failing tests, builds, CI jobs, crashes and regressions. Not for new features without a failure. Combine with soturail-core and usually soturail-change."
license: Apache-2.0
metadata:
  soturail-schema: soturail.skill.v2
  soturail-uses: command.run raw.inspect.redacted project.read repo.index context.select structural.impact evidence.collect
---

# SotuRail Debug

Reproduce, isolate, fix, re-run the same check.

## Workflow

1. **Reproduce** with `command.run` (`soturail run -- <command>`). The exit code is the authoritative signal; output wording varies by tool and locale.
2. **Inspect** the recorded output with `raw.inspect.redacted` instead of pasting full logs. Prefer structured reports (JUnit, JSON reporters, compiler diagnostics) when the project can emit them.
3. **Isolate.** Form hypotheses from the evidence, read only the implicated files, and record the most likely cause as a `claim` candidate citing the log and source lines.
4. **Fix** the cause, not the symptom. If the fix changes behavior beyond the failure, switch to soturail-change discipline.
5. **Confirm** by re-running the identical command and `evidence.collect`. A different command is not confirmation.

## Constraints

- Never weaken, skip or delete a test to make it pass unless the human agrees the test is wrong.
- Raw logs stay redacted over MCP; exact disclosure is a local human decision.
- If the failure is environment-specific and cannot be reproduced, report it as `unknown` with what was tried.

## Done

Failing check now passes in a recorded run, or the cause is reported with evidence and the remaining blocker.
