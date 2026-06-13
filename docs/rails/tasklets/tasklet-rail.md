# Tasklet Rail

Tasklet Rail manages small reusable local task templates. A tasklet describes bounded work; it is not an autonomous agent or task runner.

## Commands

```bash
soturail tasklet create review-docs
soturail tasklet list
soturail tasklet run review-docs --dry-run
soturail tasklet export review-docs
```

Tasklets live under:

```txt
.soturail/tasklets/<name>.md
```

Each template includes:

- Objective
- Allowed context
- Allowed files
- Disallowed actions
- Verification commands
- Definition of done
- Expected handoff

`tasklet run` always returns a dry-run simulation and never executes shell commands. `tasklet export` writes an agent-readable handoff under `.soturail/exports/tasklets/`.

Related: [Skill Rail 2.0](../skills/skill-rail-2.md), [Workflow Rail](../harness/workflow-rail.md), [Security Boundaries](../../security/security-boundaries.md).
