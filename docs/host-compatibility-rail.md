# Host Compatibility Rail

Host Compatibility Rail is the v1.1.0 direction for making SotuRail outputs useful across coding-agent hosts without becoming an agent host itself.

## Goal

```txt
SotuRail prepares local context, reports, specs, memory and evidence.
Agent hosts execute the reasoning/editing loop.
```

Supported host families should be treated as runtime surfaces with different capabilities, not as one generic prompt box.

## Target Hosts

| Host family | Planned SotuRail output |
| --- | --- |
| Claude / Claude Code-style | short `CLAUDE.md`, referenced docs, MCP/resource notes, report agent brief |
| Codex-style | `AGENTS.md`-friendly Markdown, safe commands, report/status summaries |
| OpenCode | generic-compatible `AGENTS.md`, context packs and report briefs |
| Cursor | rules/context docs, dashboard/report references and safe workflow notes |
| Antigravity-style | high-priority experimental `AGENTS.md`, context pack and Gemini-to-Antigravity migration notes |
| Gemini legacy/compatible | AGENTS/GEMINI Markdown handoff for mixed host behavior |
| Deep Agents-style | role packs, subagent notes, filesystem evidence and human approval notes |
| Generic MCP host | read-only report/status/brain/bench/baseline/host manifests and exposure reports |

## Planned Commands

```bash
soturail agents matrix
soturail agents matrix --json
soturail agents doctor --host opencode
soturail agents doctor --all --json
soturail agents export --agent opencode
soturail agents export --agent antigravity
soturail agents export --agent deepagents
soturail agents export --agent generic
soturail mcp resources host-manifest --host opencode
```

## Capability Matrix Fields

Each host entry should eventually report:

- instruction file support;
- rules/settings support;
- MCP support;
- skills support;
- hooks support;
- prompt-only fallback quality;
- safe config write support;
- report/status format preference;
- known limitations;
- required human review.
- mutation allowed by default, which must remain `false`.

## Safety Defaults

- Prefer dry-run and preview before writing host config.
- Back up files before modifying host-specific config.
- Keep read-only MCP resources separate from tools.
- Do not expose destructive MCP tools by default.
- Do not claim first-class support until the export path has tests and docs.
- Always keep a generic Markdown fallback.
- Keep `.soturail/raw` out of agent handoff files.
- Use `soturail agents doctor --host <host>` before copying exports into host-visible locations.

## Relationship To Existing Rails

| Rail | How Host Compatibility uses it |
| --- | --- |
| Context Packs | host-specific selected context |
| Role Packs | planner/executor/reviewer/release-manager/researcher bundles |
| Report Rail | agent-readable status and next commands |
| MCP Report Resources | read-only host resources |
| Policy Rail | config write, hook and tool exposure checks |
| Skill Rail | host-aware skill export without always loading every skill |
| Workflow Rail | phase-specific host handoff |
