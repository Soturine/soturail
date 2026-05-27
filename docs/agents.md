# Agent Integrations

SotuRail provides reviewed, project-local agent integration exports for Claude, Codex, Gemini, Cursor, Antigravity, Generic, OpenCode/Amp/Kiro-style hosts and experimental Deep Agents-style targets.

```bash
soturail agents list
soturail agents capabilities
soturail agents capabilities --json
soturail agents status
soturail agents status --json
soturail agents doctor
soturail agents doctor --verbose
soturail agents export --agent all
soturail brain export --agent codex
soturail agents export --agent deepagents
soturail agents export --agent deepagents-js
soturail agents install --agent claude --dry-run
soturail agents install --agent cursor --dry-run
soturail agents install --agent gemini --dry-run
soturail agents install --agent claude --mode mcp --dry-run
soturail agents install --agent claude --mode safe-hooks --dry-run
soturail agents install --agent codex --mode prompt-only --dry-run
soturail agents install --agent cursor --mode rules --dry-run
soturail agents uninstall --agent claude --dry-run
```

Exports are written under `.soturail/exports/agents/<agent>/`. They are meant to be reviewed before use.

Project Brain exports are written under `.soturail/brain/exports/`. They provide verified claims, rules, gaps, stale warnings and source references for agent handoff.

## Safe Defaults

- Install commands support `--dry-run`.
- Existing project files get `.soturail.bak` backups before modification.
- Unknown global app config locations are not modified.
- Antigravity support is prompt-only/context-pack unless a stable local config format is reviewed.
- SotuRail does not enable arbitrary shell execution through MCP.
- Deep Agents/deepagents-js support starts as export-only context/config artifacts, not runtime coupling.
- Claude Code Harness-style compatibility should be optional and workflow/evidence-oriented, not a hard dependency.
- Generated files should be reviewed before enabling in an agent host.

## Runtime Adapter Commands

`soturail agents capabilities` prints the host capability matrix. Use `--json` for a stable machine-readable shape.

`soturail agents status` inspects local files such as `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules/`, `.claude/settings.json`, `.soturail/exports/agents/`, role packs, skills, MCP exports, policy queues and run workspaces.

`soturail agents doctor --verbose` combines readiness checks with host capability, payload, policy and dry-run install guidance.

## v0.6.1 UX Flow

Start with status, budget and one role pack, then preview the host install or export.

```bash
soturail init
soturail agents status
soturail agents capabilities
soturail context budget --explain
soturail context pack --role planner
soturail agents install --agent claude --dry-run
soturail agents export --agent claude
```

For conservative hosts, prefer prompt-only export:

```bash
soturail agents export --agent antigravity
soturail agents export --agent deepagents
soturail agents export --agent generic
```

## Dry-Run Install Workflow

Dry-run first:

```bash
soturail agents install --agent claude --dry-run
soturail agents install --agent cursor --dry-run
soturail agents install --agent gemini --dry-run
```

Review:

- which files would be written;
- whether backups would be created;
- which context packs, role packs and policy folders are referenced;
- host-specific payload recommendations;
- policy warnings for raw logs, secrets, hooks, MCP and release/publish actions.

Then apply only after review:

```bash
soturail agents install --agent claude --backup --yes
```

Real installs remain project-local and backup-first.

## Doctor Guidance

In a clean project, `soturail agents doctor` points users toward the safest setup order:

```bash
soturail context pack --target all
soturail agents export --agent all
soturail mcp smoke
soturail workflow new "Implement feature"
```

If context packs or exports already exist, the doctor omits those setup steps and keeps the remaining checks visible.

## Current Outputs

- Claude: `CLAUDE.md`, `mcp-config.json`, `safe-hooks.md`, `context-pack.md`.
- Codex: `AGENTS.md`, `context-pack.md`, `prompt-only.md`.
- Gemini: `GEMINI.md`, `context-pack.md`, `prompt-only.md`.
- Cursor: `cursor-rules.md`, `context-pack.md`, `prompt-only.md`.
- Antigravity: `context-pack.md`, `prompt-only.md`.
- Generic: `context-pack.md`, `prompt-only.md`.
- OpenCode/Amp/Kiro-style hosts: `context-pack.md`, `prompt-only.md`.
- Deep Agents/deepagents-js: `<agent>.md`, `runtime-config.json`, `context-pack.md`.

## Host Capability Matrix

SotuRail encodes host capabilities instead of assuming every agent supports the same controls.

| Host family | Context format | Install mode | MCP posture | Hook/config posture | Policy caveats |
| --- | --- | --- | --- | --- | --- |
| Claude Code | Tagged/Markdown context, role packs, `CLAUDE.md` | dry-run-first, backup-first | supported where local stdio config is reviewed | settings/hooks only where stable | never expose arbitrary shell; raw expansion redacted by default |
| Codex | concise Markdown, `AGENTS.md`, JSON only for configs/tools | prompt-only first | optional read-only if supported | no hard input rewriting until stable | keep prompt-only fallback |
| Gemini CLI | Markdown or tagged context, `GEMINI.md` | prompt/context export first | optional read-only where supported | host-specific docs only after stable surfaces are confirmed | avoid assuming Claude-compatible hooks |
| Cursor | rules + Markdown context | rules export with backup | optional/generic read-only | no unsafe global overwrite | warn on giant rules and stale context |
| Antigravity | prompt-only Markdown/tagged fallback | prompt-only/context-pack | unknown/experimental | no deep integration until stable official surfaces are verified | do not invent config paths |
| Deep Agents / deepagents-js | role packs, context offload notes, skills routing | export-only | future resource/config export only | no runtime coupling by default | human approval and filesystem evidence required for risky flows |
| Claude Code Harness-style workflows | workflow/evidence docs, guardrail policy, review perspectives | docs/export only | no special MCP assumption | compatibility notes only | keep SotuRail independent from Claude-only flows |
| OpenCode/Amp/Kiro-style hosts | Markdown/context packs/specs | prompt/context export first | optional read-only if supported | deeper integrations only after official surfaces are clear | host docs must remain conservative |
| Generic agents | Markdown/context packs | file export | MCP read-only resources | none | safest fallback for unknown hosts |

## Host-Aware Payload Formats

Agent exports declare the recommended format for each host:

```txt
Claude -> tagged context + Markdown summary
Gemini -> tagged or Markdown context
Codex -> concise Markdown + JSON only for configs/tools
Cursor -> rules + Markdown context
Antigravity -> prompt-only Markdown/tagged fallback
MCP -> JSON only
Generic -> Markdown
```

See [structured-payload-rail.md](structured-payload-rail.md).

## Project Brain Briefs

v0.8.0 adds:

```bash
soturail brain scan
soturail brain export --agent claude
soturail brain export --agent codex --limit 10
soturail brain export --agent gemini
soturail brain export --agent cursor
soturail brain export --agent generic
```

Use these briefs when an agent needs repo-wide facts without a giant context dump. They include source references and stale/suspect warnings, and they remind agents not to overclaim beyond evidence.

v0.8.1 briefs are cleaner and safer:

- verified, suspect and stale records are separated;
- stale claims are not shown as verified;
- sections are bounded with `--limit`;
- `--include-suspect` adds warning context when needed;
- recovery pointers name the local brain profile, freshness and repair-plan files.

## Tutorials

- [SotuRail with Claude Code](tutorial-claude-code.md)
- [SotuRail with Codex](tutorial-codex.md)
- [SotuRail with Gemini CLI](tutorial-gemini-cli.md)
- [SotuRail with Cursor](tutorial-cursor.md)
- [SotuRail with Antigravity prompt-only workflow](tutorial-antigravity.md)
- [Deep Agents-style role packs](tutorial-deep-agents-role-packs.md)
- [Harness-style setup/plan/work/review/release](tutorial-harness-workflow.md)
- [Diagram Rail and `.spec.md` visual contracts](tutorial-diagram-spec.md)
- [Choosing context formats by host](tutorial-context-formats.md)

## Agent Docs Hygiene

Root agent files should stay short and useful. Long details should live in referenced docs, context packs or workflow artifacts.

Useful commands:

```bash
soturail agents lint
soturail agents split-context --dry-run
soturail agents explain --agent all
soturail agents capabilities
```

Expected checks:

- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and Cursor rules are not giant wiki files.
- Host-specific exports reference richer docs instead of pasting everything.
- Secrets, local-only auth instructions and raw logs are not exposed.
- Safe prompt-only fallback exists for hosts without stable hook/MCP support.
- Build/test/release commands are present or linked.
- Agent docs link to specs, diagrams, policy docs, context packs and workflows instead of copying them wholesale.

See [agent-docs-hygiene.md](agent-docs-hygiene.md).

## Future Role-Based Exports

Deep Agents-style systems validate role separation, but SotuRail should remain the local rail layer.

Future exports can include role packs:

```bash
soturail agents export --agent all --role planner
soturail agents export --agent all --role executor
soturail agents export --agent all --role reviewer
soturail agents export --agent all --role release-manager
soturail agents export --agent all --role researcher
soturail agents export --agent deepagents --role all
```

Those exports should explain:

- which role the pack is for;
- which context was included;
- which context was omitted;
- which skills are suggested;
- which policy checks apply;
- which raw IDs or workflow IDs provide recovery evidence;
- which payload format was chosen;
- whether any long context was offloaded.

## Future Harness And Handoff Support

SotuRail can support disciplined handoffs without becoming the agent runtime.

Possible future commands:

```bash
soturail agents handoff --from planner --to executor
soturail workflow handoff <id> --to reviewer
soturail agents export --agent claude --role release-manager
```

A handoff should include:

- current workflow state;
- role pack;
- selected skills;
- relevant memory;
- policy decisions;
- evidence pack pointers;
- raw/offload recovery IDs;
- next safe command suggestions.
