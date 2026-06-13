# Tutorial: SotuRail With Cursor

Cursor support focuses on project-local rules and context references. SotuRail previews rule writes before making changes.

```bash
soturail init
soturail agents status
soturail context budget --explain
soturail context pack --role reviewer
soturail agents install --agent cursor --dry-run
soturail agents install --agent cursor --mode rules --dry-run
soturail agents export --agent cursor
```

Review `.cursor/rules/` output before enabling it. Generated rules should stay small and link to richer docs, role packs and policy notes.

Good Cursor handoff:

- concise project rule;
- current role pack;
- selected files with reasons;
- policy notes for secrets, raw logs and MCP exposure;
- recovery command for offloaded context.
