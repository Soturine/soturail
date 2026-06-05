# Rate Limit And Fallback Policy

This document describes the future SotuRail policy model for rate-limit and fallback guidance. It is documentation-first and local-first.

## Policy Fields

A future policy file could live at:

```txt
.soturail/policies/rate-limit-and-fallback.yaml
```

Example:

```yaml
hosts:
  claude:
    fallback: codex
    contextFallback: markdown
  cursor:
    fallback: generic
    contextFallback: cursor-rules-lite
workflows:
  default:
    maxAgentTurns: 20
    requireHandoffAfterMinutes: 30
    requireApprovalForExternalCalls: true
```

## Fallback Types

| Fallback | Meaning |
| --- | --- |
| host fallback | export the same SotuRail context to a different agent host |
| format fallback | use Markdown/static files when MCP or skills are unsupported |
| role fallback | reduce full workflow context to planner/executor/reviewer packs |
| offline fallback | keep local docs/reports usable when no provider is available |

## Non-Goals

- no live billing control;
- no provider account automation;
- no quota bypass;
- no traffic interception;
- no promise that fallback preserves model behavior.
