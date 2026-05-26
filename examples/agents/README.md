# Agent Examples

These examples show how to use SotuRail exports without modifying global agent configuration.

```bash
soturail agents doctor
soturail agents doctor --verbose
soturail agents capabilities
soturail agents status
soturail agents export --agent all
soturail agents install --agent claude --dry-run
soturail agents install --agent cursor --dry-run
soturail agents install --agent gemini --dry-run
soturail mcp config --agent generic
```

Review generated files under `.soturail/exports/agents/` before enabling them in any agent host.

Deep Agents-style exports are context/config artifacts only:

```bash
soturail agents export --agent deepagents
soturail agents export --agent deepagents-js
```
