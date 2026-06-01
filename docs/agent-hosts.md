# Agent Hosts

SotuRail v1.0.0 includes a conservative host compatibility matrix. It reports what SotuRail can export safely without claiming direct runtime control over every host.

```bash
soturail agents matrix
soturail agents matrix --json
```

## Host Status Model

- `stable`: covered by the v1 local export/report surface.
- `legacy`: supported through compatible prompt/context artifacts, but host behavior may vary.
- `experimental`: prompt-only or docs-only until host-specific surfaces are verified.
- `planned`: not promoted yet.
- `unknown`: not enough local evidence.

## Covered Hosts

- Codex: stable prompt/context/report handoff through AGENTS-style Markdown.
- Claude: stable local docs and dry-run-first install/export guidance.
- Cursor: stable local rules/export guidance, with MCP treated conservatively.
- Gemini compatible hosts: legacy/prompt-compatible Markdown and JSON summaries.
- OpenCode-style hosts: experimental prompt-only export.
- Antigravity-style hosts: experimental prompt-only export.
- DeepAgents-style targets: experimental role-pack and Markdown exports only.
- Generic: stable portable Markdown, JSON reports and read-only MCP report resources.

## Safety

No host row enables destructive MCP tools or arbitrary shell execution. Config writes remain dry-run or review-first. Use `soturail report agent --agent <host>` and review the output before agent handoff.
