# Workflow Rail

Workflow Rail is a local task state system for SotuRail. It stores auditable workflow artifacts under `.soturail/workflows/` and can optionally plan or create local Git worktrees.

```bash
soturail workflow new "Implement feature"
soturail workflow list
soturail workflow show <id>
soturail workflow plan <id>
soturail workflow start <id> --worktree --dry-run
soturail workflow status <id>
soturail workflow verify <id>
soturail workflow close <id>
soturail workflow cleanup --closed --dry-run
```

## State Machine

Workflows use explicit states:

- `draft`
- `planned`
- `active`
- `verifying`
- `ready_for_review`
- `closed`
- `blocked`

## Storage

Each workflow uses:

```txt
.soturail/workflows/<id>/
├── workflow.yml
├── plan.md
├── tasks.md
├── verification.md
└── logs/
```

## Worktrees

`soturail workflow start <id> --worktree --dry-run` prints a local worktree plan. If run without `--dry-run` inside a Git repository, SotuRail may create a local worktree under `.soturail/worktrees/<id>/`.

Safety rules:

- SotuRail does not push.
- SotuRail does not merge.
- SotuRail does not delete user work without explicit confirmation.
- Rollback instructions are printed when worktrees are planned.

## Verification

`soturail workflow verify <id>` only runs configured safe checks when they are explicit. Without configured checks, it prints a checklist instead of inventing commands.

## Cleanup

`soturail workflow cleanup --closed --dry-run` previews closed workflow records that could be removed. It does not delete anything unless rerun with `--closed --yes` after review.
