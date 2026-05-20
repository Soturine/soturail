# Agent Hooks

SotuRail hook support is cautious. Claude gets a conservative hook template first; Codex, Gemini and Cursor remain prompt-only fallbacks because host APIs are not all stable.

```bash
soturail hooks list
soturail hooks doctor
soturail hooks install claude --dry-run
soturail hooks install all --dry-run
soturail hooks prompt-only codex
```

Installers create backups before modifying existing files. If a host config location is uncertain, SotuRail generates prompt-only guidance instead of guessing.

Claude install writes `.claude/settings.json` and hook scripts under `.claude/hooks/`. Dry-run prints every file that would change.
