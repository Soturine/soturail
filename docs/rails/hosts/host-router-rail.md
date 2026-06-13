# Host Router Rail

Host Router Rail is a planned host/export layer inspired by router products, but it routes context formats, not model traffic.

```txt
One SotuRail context source -> many host-specific exports.
```

## Goal

Generate the best safe local artifact for each host:

| Host | Example export |
| --- | --- |
| Claude Code | `CLAUDE.md`, skills guidance, MCP read-only manifest |
| Codex | `AGENTS.md`, instructions and safe command handoff |
| Cursor | `.cursor/rules` style prompt/rule files |
| OpenCode | OpenCode-compatible instructions and role packs |
| Gemini | `GEMINI.md` style guidance |
| generic | Markdown context pack and report bundle |

## Proposed Commands

```bash
soturail export all
soturail translate --to claude
soturail translate --to codex
soturail translate --to cursor
soturail hosts status
soturail doctor --hosts
soturail export --fallback
```

## Context Optimization

Host Router Rail should connect to context budgeting:

```bash
soturail context optimize
soturail context budget
soturail context compact
```

Potential outputs:

```txt
.soturail/context/full.md
.soturail/context/compact.md
.soturail/context/ultra.md
.soturail/exports/claude/
.soturail/exports/codex/
.soturail/exports/cursor/
```

## Fallbacks

Fallback should mean safe format fallback, not provider or quota bypass:

- MCP unsupported -> static Markdown/resources;
- skills unsupported -> prompt-only instructions;
- huge context -> compact role pack;
- host unknown -> generic export.

## Hard Boundary

SotuRail must not:

- intercept IDE traffic;
- proxy model requests;
- manage or rotate provider accounts;
- use browser cookies or session tokens;
- bypass quotas;
- promise unlimited free model access.
