# Tutorial: Antigravity Prompt-Only Workflow

Antigravity support is high-priority but experimental until stable Google-local config surfaces are confirmed. SotuRail exports context artifacts and avoids inventing host config paths.

```bash
soturail init
soturail agents status
soturail context route --query "review release policy"
soturail context pack --role reviewer
soturail agents export --agent antigravity
soturail agents doctor --host antigravity
soturail report agent --agent antigravity
soturail mcp resources host-manifest --host antigravity
```

Use the generated `.soturail/agents/antigravity/` files as reviewed prompt/context input. The older `.soturail/exports/agents/antigravity/` mirror remains for compatibility.

Safe defaults:

- no global config writes;
- no hooks;
- no arbitrary MCP shell execution;
- raw logs stay local unless explicitly reviewed and redacted.

Transition note: users moving from Gemini-style prompt handoffs can start with `AGENTS.md` plus `context-pack.md`, then keep `.soturail/reports/agent-antigravity.md` and `.soturail/mcp/host-manifests/antigravity.json` as evidence references.
