# Host Compatibility Rail

Host Compatibility Rail is the v1.1.0 direction for making SotuRail outputs useful across coding-agent hosts without becoming an agent host itself.

## Host Fit

`soturail agents matrix`, `agents doctor --host <host>` and `agents doctor --all` form the current Host Fit Doctor surface. They report compatibility, export support, limitations and safe next commands without model serving or runtime installation.

Hermes and Odysseus are ecosystem influences, not direct stable host integrations. Hermes is an agent runtime and Odysseus is a broader workspace/runtime stack. Generic-compatible exports remain the safe fallback until a host-specific path is implemented and tested.

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

## Host Router Expansion

Future host work is tracked in [`host-router-rail.md`](host-router-rail.md).

The host-router idea means context-format routing, not model-request routing:

```txt
one SotuRail context source -> Claude/Codex/Cursor/OpenCode/Gemini/generic exports
```

SotuRail must not intercept IDE traffic, proxy provider requests, manage browser tokens or bypass quotas.

## v1.6 Host Adapter Registry

Every per-host fact — skill projection directory, context/brain/report targets, MCP config family, setup command, matrix status/priority/label, instruction files, report decoration and host notes — lives in one data record in `src/core/host-adapters.ts`. Core modules call `getHostAdapter(id)` instead of branching on host names; an unknown host resolves to the generic adapter. Adding a host means adding one adapter record plus fixtures.

Literal host branches in `src/`: **121 before, 7 after** (the registry's own generic fallback, three mode-specific install generators and the generic brain alias).

### Skill projection

| Host | Project skills directory | Verification |
|---|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` (does not read `.agents/skills`) | verified docs, 2026-10-04 |
| Codex | `.agents/skills/` | verified docs, 2026-10-04 |
| Cursor | `.agents/skills/` (also `.cursor/skills`, `.claude/skills`, `.codex/skills`) | verified docs, 2026-10-04 |
| Gemini CLI | `.agents/skills/` alias (also `.gemini/skills`) | verified docs, 2026-10-04 |
| Kimi, OpenCode, Amp, Kiro, Antigravity, Deep Agents, gemini-legacy and unknown hosts | portable `.agents/skills/` | generic fallback — native support not claimed |

```bash
soturail skills export --target claude --layout portable --install   # writes .claude/skills/
soturail skills export --target codex --layout portable --install    # writes .agents/skills/
soturail skills export --target kimi --layout portable               # generic fallback under .soturail/exports
```

Installed directories carry `.soturail-projection.json`. SotuRail only replaces directories with that marker; a user-authored skill with the same name is skipped (`unmanaged_existing_dir`). Projections are not reloaded as separate project skills.
