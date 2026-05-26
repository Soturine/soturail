# Tutorial: Antigravity Prompt-Only Workflow

Antigravity support is prompt-only until stable local config surfaces are confirmed. SotuRail exports context artifacts and avoids inventing host config paths.

```bash
soturail init
soturail agents status
soturail context route --query "review release policy"
soturail context pack --role reviewer
soturail agents export --agent antigravity
```

Use the generated `.soturail/exports/agents/antigravity/` files as reviewed prompt/context input.

Safe defaults:

- no global config writes;
- no hooks;
- no arbitrary MCP shell execution;
- raw logs stay local unless explicitly reviewed and redacted.
