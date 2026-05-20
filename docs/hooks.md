# Agent Hooks

SotuRail hook support is cautious. Host APIs are not all stable, so prompt-only rules are always available.

```bash
soturail hooks list
soturail hooks doctor
soturail hooks install claude --dry-run
soturail hooks install all --dry-run
soturail hooks prompt-only codex
```

Installers create backups before modifying existing files. If a host config location is uncertain, SotuRail generates prompt-only guidance instead of guessing.
