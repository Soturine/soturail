# Tutorial: SotuRail With Claude Code

Use SotuRail to prepare short Claude-facing instructions, role packs, context packs and safe MCP notes. SotuRail does not become Claude Code and does not enable hooks automatically.

```bash
soturail init
soturail agents status
soturail context budget --explain
soturail context pack --role planner
soturail agents install --agent claude --dry-run
soturail agents export --agent claude
```

Review the dry-run output before applying anything. It should show planned files, backup behavior, role/context references and policy notes.

Keep `CLAUDE.md` short:

- project identity;
- safety rules;
- how to recover context with SotuRail commands;
- links to `agent_docs/`, `.soturail/context/` and role packs.

Use `soturail agents doctor --verbose` when you need host capability and policy guidance in one place.
