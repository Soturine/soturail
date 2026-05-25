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

Planned posture:

| Host family | Recommended posture |
| --- | --- |
| Claude Code | Settings/hooks/MCP where stable; dry-run-first and backup-first. |
| Codex | Prompt-only/context-pack mode until hard input rewrite hooks are stable. |
| Gemini CLI | MCP/context files/prompt fallback where supported. |
| Cursor | Rules/context exports with no unsafe global overwrite. |
| Antigravity | Prompt-only/context-pack until stable integration surfaces are verified. |
| Deep Agents / deepagents-js | Context/config/role-pack exports only until safe integration surfaces are reviewed. |
| OpenCode/Amp/Kiro-style hosts | Prompt/context exports first; deeper integrations only after official surfaces are clear. |
| Generic agents | Markdown/context packs and MCP read-only resources. |

## Future Agent Docs Hygiene

Root agent files should stay short and useful. Long details should live in referenced docs, context packs or workflow artifacts.

Planned commands:

```bash
soturail agents lint
soturail agents split-context
soturail agents explain
soturail agents capabilities
```

Expected checks:

- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and Cursor rules are not giant wiki files.
- Host-specific exports reference richer docs instead of pasting everything.
- Secrets, local-only auth instructions and raw logs are not exposed.
- Safe prompt-only fallback exists for hosts without stable hook/MCP support.

## Future Role-Based Exports

Deep Agents-style systems validate role separation, but SotuRail should remain the local rail layer.

Future exports can include role packs:

```bash
soturail agents export --agent all --role planner
soturail agents export --agent all --role executor
soturail agents export --agent all --role reviewer
soturail agents export --agent all --role release-manager
soturail agents export --agent deepagents --role all
```

Those exports should explain:

- which role the pack is for;
- which context was included;
- which context was omitted;
- which skills are suggested;
- which policy checks apply;
- which raw IDs or workflow IDs provide recovery evidence.
