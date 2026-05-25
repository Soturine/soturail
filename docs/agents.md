# Agent Integrations

SotuRail provides reviewed, project-local agent integration exports for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.

```bash
soturail agents list
soturail agents doctor
soturail agents export --agent all
soturail agents install --agent claude --mode mcp --dry-run
soturail agents install --agent claude --mode safe-hooks --dry-run
soturail agents install --agent codex --mode prompt-only --dry-run
soturail agents install --agent cursor --mode rules --dry-run
soturail agents uninstall --agent claude --dry-run
```

Exports are written under `.soturail/exports/agents/<agent>/`. They are meant to be reviewed before use.

## Safe Defaults

- Install commands support `--dry-run`.
- Existing project files get `.soturail.bak` backups before modification.
- Unknown global app config locations are not modified.
- Antigravity support is prompt-only/context-pack unless a stable local config format is reviewed.
- SotuRail does not enable arbitrary shell execution through MCP.
- Future Deep Agents/deepagents-js support should start as export-only context/config artifacts, not runtime coupling.
- Claude Code Harness-style compatibility should be optional and workflow/evidence-oriented, not a hard dependency.

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

## Future Host Capability Matrix

SotuRail should eventually encode host capabilities instead of assuming every agent supports the same controls.

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

## Future Host-Aware Payload Formats

Agent exports should eventually declare the recommended format for each host:

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

## Future Agent Docs Hygiene

Root agent files should stay short and useful. Long details should live in referenced docs, context packs or workflow artifacts.

Planned commands:

```bash
soturail agents lint
soturail agents split-context
soturail agents explain
soturail agents capabilities
soturail agents docs doctor
soturail agents docs suggest
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
