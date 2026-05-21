# Cursor Hooks

Cursor prompt-only integration writes `.cursor/rules/soturail.mdc` when installed.

Existing files are backed up before SotuRail adds its rules.

Useful commands:

```bash
soturail hooks install cursor --dry-run
soturail hooks install cursor
soturail hooks uninstall cursor
soturail hooks prompt-only cursor
```

Review generated prompt rules before enabling them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.
