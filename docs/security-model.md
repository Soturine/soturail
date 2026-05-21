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

Raw logs may contain secrets. Do not commit `.soturail/raw/`. MCP raw-log expansion redacts probable secrets by default unless `allow_raw=true` is explicitly passed.

## MCP And Skills

The v0.3.0 MCP server does not expose arbitrary shell execution. Skill Rail exports are local files for human review; SotuRail does not auto-install unreviewed third-party skills.

## Limitations

SotuRail does not isolate processes, prevent all shell tricks or replace OS permissions. Treat it as a policy and evidence layer.
