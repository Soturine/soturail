# Security Model

SotuRail reduces accidental damage from AI-assisted terminal use. It is not a sandbox and does not make untrusted commands safe.

## Blocked by Default

- `rm -rf`
- `sudo`
- `format`
- `dd if=`
- `curl | sh`
- `wget | sh`
- `del /s`
- `git push`

## Unsafe Confirmation

Dangerous commands can only run when the exact phrase is supplied:

```text
I_UNDERSTAND_THIS_CAN_DESTROY_DATA
```

This is intentionally verbose so accidental bypasses are unlikely.

## Raw Logs

Raw command logs remain on disk so compressed summaries can always be audited.

Raw logs may contain secrets. Do not commit `.soturail/raw/`. CLI expansion redacts probable secrets by default:

```bash
soturail expand <raw_id>
```

Exact raw output requires an explicit opt-in:

```bash
soturail expand <raw_id> --allow-raw --yes
```

MCP raw-log expansion also redacts probable secrets by default unless `allow_raw=true` is explicitly passed.

## MCP, Skills, Agents And Workflows

The MCP server does not expose arbitrary shell execution. Skill Rail exports are local files for human review; SotuRail does not auto-install unreviewed third-party skills.

Agent installs are dry-run-first and backup-first. Unknown global host config locations are not modified automatically.

Workflow Rail does not push, merge or delete worktrees automatically. Worktree support is local and review-oriented.

## Limitations

SotuRail does not isolate processes, prevent all shell tricks or replace OS permissions. Treat it as a policy and evidence layer.
