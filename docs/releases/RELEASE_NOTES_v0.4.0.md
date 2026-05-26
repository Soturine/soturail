# SotuRail v0.4.0 - Real Agent Integrations & Workflow Rail

SotuRail v0.4.0 adds real agent integration exports, MCP config helpers and a safe Workflow Rail for local task planning and optional Git worktree isolation.

## Highlights

- Agent registry for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.
- Agent-specific context and prompt exports.
- MCP config helper and MCP smoke test.
- Improved hooks exports and dry-run safety.
- Workflow Rail with local task state.
- Optional Git worktree isolation.
- Strong release package verification.

## Install

```bash
npm install -g soturail@0.4.0
soturail --version
```

## Try It

```bash
soturail init
soturail agents doctor
soturail agents export --agent all
soturail mcp smoke
soturail workflow new "Try SotuRail Workflow Rail"
soturail workflow list
```

## Security

SotuRail does not expose arbitrary shell execution through MCP by default. Agent installs are dry-run-first and backup-first.
