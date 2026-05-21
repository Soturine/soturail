# Agent Hooks

SotuRail hook support is cautious. Claude gets conservative safe-hooks and MCP guidance first; Codex, Gemini and Cursor use prompt-only fallbacks when stable native hook APIs are unavailable.

```bash
soturail hooks list
soturail hooks doctor
soturail hooks install --agent claude --mode safe-hooks --dry-run
soturail hooks install --agent claude --mode mcp
soturail hooks install --agent codex --mode prompt-only
soturail hooks install --agent gemini --mode prompt-only
soturail hooks install --agent cursor --mode prompt-only
soturail hooks uninstall --agent claude
soturail hooks export --agent claude
soturail hooks export --agent codex
```

Installers create backups before modifying existing files. Dry-run prints every file that would change. If a host config location is uncertain, SotuRail generates prompt-only guidance instead of guessing.

Claude safe-hooks write `.claude/settings.json` and hook scripts under `.claude/hooks/`. The pre-tool hook blocks destructive command shapes and suggests `soturail run` for tests, builds and logs.

Always review generated hooks before enabling them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.

`soturail hooks doctor` prints safe modes and next commands:

- Claude: `safe-hooks` and `mcp`.
- Codex, Gemini and Cursor: `prompt-only`.
- Start with `--dry-run`.
- Export guidance with `soturail hooks export --agent claude`.
