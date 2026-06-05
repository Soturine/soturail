# Agent Examples

These examples show how to use SotuRail exports without modifying global agent configuration.

```bash
soturail agents doctor
soturail agents doctor --verbose
soturail agents doctor --host codex
soturail agents doctor --all --json
soturail agents capabilities
soturail agents status
soturail agents export --agent all
soturail agents export --agent opencode
soturail agents export --agent antigravity
soturail mcp resources host-manifest --host codex
soturail agents install --agent claude --dry-run
soturail agents install --agent cursor --dry-run
soturail agents install --agent gemini --dry-run
soturail mcp config --agent generic
```

Review generated files under `.soturail/agents/<host>/` and `.soturail/exports/agents/<host>/` before enabling them in any agent host.

Deep Agents-style exports are context/config artifacts only:

```bash
soturail agents export --agent deepagents
soturail agents export --agent deepagents-js
```
