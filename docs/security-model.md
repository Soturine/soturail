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

## Limitations

SotuRail does not isolate processes, prevent all shell tricks or replace OS permissions. Treat it as a policy and evidence layer.
