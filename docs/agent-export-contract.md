# Agent Export Contract

SotuRail v1.1.0 exports host-aware files for review. Exports are local artifacts; they are not automatic host configuration, cloud sync or runtime control.

```bash
soturail agents export --agent codex
soturail agents export --agent opencode
soturail agents export --agent antigravity
soturail agents export --agent deepagents --role reviewer
soturail agents doctor --host codex
soturail agents doctor --all --json
```

Default exports are mirrored to:

```txt
.soturail/agents/<host>/
.soturail/exports/agents/<host>/
```

The `.soturail/exports/agents/` path is kept for compatibility with older releases. The `.soturail/agents/` path is the v1.1 host workspace.

## Preferred Files

- Codex: `AGENTS.md`, `context-pack.md`
- Claude: `CLAUDE.md`, `context-pack.md`
- Cursor: `rules.md`, `context-pack.md`
- OpenCode: `AGENTS.md`, `context-pack.md`
- Antigravity-style hosts: `AGENTS.md`, `context-pack.md`
- Gemini/Gemini legacy-compatible hosts: `AGENTS.md`, `GEMINI.md`, `context-pack.md`
- DeepAgents/deepagents-js: `role-pack.md`, `subagents.md`
- Generic: `AGENT_CONTEXT.md`, `context-pack.md`

## Safety Rules

- No secrets, tokens, `.env` content or raw evidence paths in handoff files.
- No claim of destructive MCP, mutation resources or shell execution through MCP.
- No claim of host-native OpenCode, Antigravity or DeepAgents runtime support unless the matrix says so.
- DeepAgents exports are role/context artifacts only.
- Antigravity is high-priority but experimental until stable Google-local project config is documented.

Use `soturail agents doctor --host <host>` to write `.soturail/agents/<host>/doctor.json` and `.md`.
