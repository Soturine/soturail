# Agent Integrations

SotuRail v0.4.0 adds reviewed, project-local agent integration exports for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.

```bash
soturail agents list
soturail agents doctor
soturail agents export --agent all
soturail agents install --agent claude --mode mcp --dry-run
soturail agents install --agent claude --mode safe-hooks --dry-run
soturail agents install --agent codex --mode prompt-only --dry-run
soturail agents install --agent cursor --mode rules --dry-run
soturail agents uninstall --agent claude --dry-run
```

Exports are written under `.soturail/exports/agents/<agent>/`. They are meant to be reviewed before use.

## Safe Defaults

- Install commands support `--dry-run`.
- Existing project files get `.soturail.bak` backups before modification.
- Unknown global app config locations are not modified.
- Antigravity support is prompt-only/context-pack in v0.4.0.
- SotuRail does not enable arbitrary shell execution through MCP.

## Outputs

- Claude: `CLAUDE.md`, `mcp-config.json`, `safe-hooks.md`, `context-pack.md`.
- Codex: `AGENTS.md`, `context-pack.md`, `prompt-only.md`.
- Gemini: `GEMINI.md`, `context-pack.md`, `prompt-only.md`.
- Cursor: `cursor-rules.md`, `context-pack.md`, `prompt-only.md`.
- Antigravity: `context-pack.md`, `prompt-only.md`.
- Generic: `context-pack.md`, `prompt-only.md`.
