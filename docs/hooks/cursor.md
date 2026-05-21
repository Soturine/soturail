# Cursor Hooks

Cursor prompt-only integration writes `.cursor/rules/soturail.mdc` when installed.

Existing files are backed up before SotuRail adds its rules.

Useful commands:

```bash
soturail hooks install --agent cursor --mode prompt-only --dry-run
soturail hooks install --agent cursor --mode prompt-only
soturail hooks uninstall --agent cursor
soturail hooks export --agent cursor
soturail hooks prompt-only cursor
```

Review generated prompt rules before enabling them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.
