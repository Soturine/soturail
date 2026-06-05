# Agent Hosts

SotuRail v1.1.0 includes Host Compatibility Rail 1.0. It reports what SotuRail can export safely without claiming direct runtime control over every host.

```bash
soturail agents matrix
soturail agents matrix --json
soturail agents doctor --host codex
soturail agents doctor --all --json
soturail mcp resources host-manifest --host codex
```

## Host Status Model

- `stable`: covered by the v1 local export/report surface.
- `generic-compatible`: safe generic Markdown/context handoff, but not host-native integration.
- `legacy`: supported through compatible prompt/context artifacts, but host behavior may vary.
- `experimental`: prompt-only or docs-only until host-specific surfaces are verified.
- `planned`: not promoted yet.
- `unknown`: not enough local evidence.

## Covered Hosts

- Codex: stable prompt/context/report handoff through AGENTS-style Markdown.
- Claude: stable local docs and dry-run-first install/export guidance.
- Cursor: stable local rules/export guidance, with MCP treated conservatively.
- Gemini: legacy/prompt-compatible Markdown and JSON summaries.
- Gemini legacy/compatible hosts: legacy AGENTS/GEMINI Markdown export.
- OpenCode-style hosts: generic-compatible `AGENTS.md` and context-pack export.
- Antigravity-style hosts: high-priority experimental `AGENTS.md` and context-pack export.
- DeepAgents-style targets: experimental role-pack and Markdown exports only.
- Generic: stable portable Markdown, JSON reports and read-only MCP report resources.

## Safety

No host row enables destructive MCP tools or arbitrary shell execution. Config writes remain dry-run or review-first. Use `soturail report agent --agent <host>`, `soturail agents doctor --host <host>` and review the output before agent handoff.

See [host-matrix-schema.md](host-matrix-schema.md), [agent-export-contract.md](agent-export-contract.md) and [mcp-host-manifest.md](mcp-host-manifest.md).

## Related Host Router And Resilience Docs

Host docs are connected to several planned rails:

- [`host-router-rail.md`](host-router-rail.md): one local context source exported into host-specific formats with safe fallback.
- [`host-compatibility-rail.md`](host-compatibility-rail.md): current host matrix, schema and export contracts.
- [`rate-limit-and-fallback-policy.md`](rate-limit-and-fallback-policy.md): local documentation shape for retry/fallback/rate-limit expectations.
- [`resilience-rail.md`](resilience-rail.md): provider and workflow-risk warnings without proxying model traffic.
- [`agent-qa-rail.md`](agent-qa-rail.md): golden checks for host exports.

SotuRail host support means context, instruction, report, skill and MCP-resource packaging. It does not mean intercepting IDE traffic, reusing browser tokens, routing model requests or bypassing provider quotas.
