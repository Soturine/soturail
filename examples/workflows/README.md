# Workflow Examples

Workflow Rail stores local task state under `.soturail/workflows/`.

```bash
soturail workflow new "Fix bug"
soturail workflow list
soturail workflow plan <id>
soturail workflow start <id> --worktree --dry-run
soturail workflow verify <id>
```

SotuRail does not push, merge or delete worktrees automatically.
