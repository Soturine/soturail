# Spec-Driven Workflow

SotuRail specs live under `.soturail/specs/`.

```bash
soturail spec new "feature idea"
soturail spec status
soturail spec validate
soturail spec task add .soturail/specs/001-feature "Write tests"
soturail spec task list .soturail/specs/001-feature
soturail spec task done .soturail/specs/001-feature 1
```

v0.2.0 specs include:

- `constitution.md`
- `spec.md`
- `plan.md`
- `tasks.md`
- `verification.md`
- `context-budget.md`
- `security-impact.md`
