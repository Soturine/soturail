# Ecosystem Influences And Product Ideas

This document records outside ideas that can influence SotuRail without turning SotuRail into a clone, wrapper, vendor fork or unsupported benchmark claim.

SotuRail's identity remains:

```txt
SotuRail is the local Context OS layer for AI coding agents.
It prepares, filters, compresses, remembers, governs and reports context.
It is not the model, not the agent brain and not a heavy production gateway.
```

## Ground Rules

- Absorb patterns, do not copy implementation details.
- Keep local-first behavior as the default.
- Keep safe defaults: no arbitrary shell execution through MCP, no raw secret exposure, no global config writes without dry-run/backup.
- Do not claim superiority over adjacent projects without reproducible benchmarks.
- Prefer small releases with tests, clean-folder smoke coverage and release evidence.

## Agent Harness Engineering

Agent harness work reinforces that the useful agent is not only the model. It is the model plus prompts, tools, context policy, hooks, sandboxes, memory, traces, feedback loops and recovery paths.

What to add to SotuRail:

- **Harness Failure Ledger**: every repeated agent mistake can become a local rule, hook, checklist or workflow verification item.
- `soturail harness note "agent mistake"` as a future command to convert a failure into an actionable improvement candidate.
- `soturail harness doctor` to check whether the repo has short agent instructions, safe hooks, context packs, MCP smoke coverage and workflow verification.
- Link failures to evidence: command raw IDs, changed files, workflow IDs and release reports.

Where it maps:

- `rules`
- `policy`
- `workflow verify`
- `agents doctor`
- `report`
- future `harness` commands

## Mixture-Of-Experts As A Context Router Pattern

MoE systems route work to the right experts instead of activating everything for every input. SotuRail can use this as a product metaphor without implementing a neural MoE.

What to add to SotuRail:

- **Context Expert Router**: route a task to the smallest useful context bundle.
- Example experts:
  - code expert: source files, symbols, failing tests;
  - docs expert: README, roadmap, usage guides;
  - release expert: changelog, release notes, npm/GitHub state;
  - security expert: raw logs, redaction, policy, secrets;
  - workflow expert: current plan, tasks, verification;
  - memory expert: approved memory and historical decisions.
- `soturail context route --query "..."` as a later alias or layer over `context select`.
- Route reports showing which expert was selected, what was omitted and why.

Where it maps:

- `context select`
- `context prune`
- `memory recall`
- `rules search`
- `workflow trace`
- `bench context-quality`

## Deep Agent And Sub-Agent Patterns

Deep agent frameworks emphasize task planning, scoped sub-agents, filesystem state, tool loops and durable working memory.

What to add to SotuRail:

- Keep SotuRail as the rail layer, not the autonomous agent runtime.
- Add safer task handoff artifacts for agents:
  - planner context pack;
  - executor context pack;
  - reviewer context pack;
  - release-manager context pack.
- Add workflow templates that split complex work into plan, implementation, review and verification records.
- Add report output that says which context pack was meant for which role.

Where it maps:

- `workflow`
- `skills`
- `agents export`
- `context pack`
- `report`

## Claude Code, AGENTS.md And Minimal Context Hygiene

Community posts around Claude Code/AGENTS.md repeatedly point to the same practical rule: small root instruction files work better than giant wiki files. Large docs should be referenced, not pasted everywhere.

What to add to SotuRail:

- `soturail agents lint` to warn when `CLAUDE.md`, `AGENTS.md` or similar files are too long, stale or missing key project facts.
- `soturail agents split-context` to suggest moving large details into `agent_docs/` or `.soturail/context/`.
- `soturail agents explain` to show what each host receives and what remains only referenced.
- Keep host-specific setup conservative: prompt-only fallback first, dry-run installs, backups before writes.

Where it maps:

- `agents doctor`
- `agents export`
- `context pack`
- future `agents lint`

## Spec-Driven Development And Growth-AI Style Workflows

Spec-driven posts and platform-style workflow examples reinforce a product flow that starts with intent and ends with verification, not just code generation.

What to add to SotuRail:

- Stronger workflow templates:
  - idea;
  - PRD;
  - architecture notes;
  - tasks;
  - tests/TDD;
  - implementation evidence;
  - release evidence.
- `soturail workflow scaffold --type feature|bugfix|release`.
- `soturail workflow verify` should connect tasks, tests, commands and raw logs.

Where it maps:

- `workflow`
- `spec`
- `rules`
- `report`

## Agent UI, AG-UI, MCP Apps And OpenUI Patterns

Modern agent systems increasingly need structured UI, event streams, tool result rendering, user approvals and live progress views.

What to add to SotuRail later:

- Local report/dashboard mode before any heavy cloud product.
- `soturail report serve` or `soturail trace serve` for local HTML.
- Optional MCP Apps / MCP-UI compatible resources for safe visualization of:
  - context selection;
  - memory recall;
  - command traces;
  - workflow state;
  - release gates;
  - reducer/dedupe savings.
- Optional AG-UI-style event stream for UIs, but only after CLI reports are stable.
- No remote code execution or unsafe UI rendering by default.

Where it maps:

- `report`
- `trace`
- `mcp`
- future dashboard work

## auth.md And Agent-Readable Auth Docs

Agent-readable authentication docs are useful because agents often fail when auth flows, environment variables and permissions are unclear.

What to add to SotuRail:

- Optional `AUTH.md` or `docs/auth.md` scaffold template.
- `soturail policy auth-check` to detect missing auth docs for projects with API integrations.
- Redaction checks for `.env`, tokens and raw logs.
- Agent-facing auth instructions should explain what is safe to read, what must never be committed and how to test auth without exposing secrets.

Where it maps:

- `policy`
- `init`
- `rules`
- `agents export`

## Compression, Structured Payloads And Benchmarks

Projects such as Squeez, SQZ, RTK, LLMLingua, TOON, SWE-pruning and long-code benchmarks point to a shared lesson: smaller is only useful when important facts survive.

What to add to SotuRail:

- Continue reducers and dedupe, but measure quality.
- Add context quality fixtures where expected files, errors, commands and rules must survive pruning.
- Add compact structured payload modes for repetitive JSON/YAML/log data.
- Add before/after reports that separate:
  - raw tokens;
  - reduced tokens;
  - metadata overhead;
  - estimated net tokens;
  - quality pass/fail;
  - raw recovery path.

Where it maps:

- `bench`
- `run`
- `dedupe`
- `format`
- `stats`
- `context select`

## Memory Systems

AgentMemory, SimpleMem, TencentDB-Agent-Memory and similar projects reinforce that memory should be explicit, queryable, scored and lifecycle-managed.

What to add to SotuRail:

- Local approved memory by default.
- Recall with reasons and source references.
- Consolidation of repeated/stale memories.
- Privacy flags and redaction before exports.
- No required cloud DB or embedding API in the default path.

Where it maps:

- `memory remember`
- `memory recall`
- `memory capture`
- `memory consolidate`
- `memory doctor`

## Governance And Safety

Agent governance projects reinforce policy, least privilege, audit logs, approvals and traceability.

What to add to SotuRail:

- `policy doctor`, `policy validate`, `policy explain`.
- Explain why a tool/resource/export is safe or blocked.
- MCP exposure report listing every resource and tool.
- Explicit confirmation for raw log expansion and config writes.

Where it maps:

- `policy`
- `mcp smoke`
- `agents install --dry-run`
- `expand --allow-raw --yes`

## Future Product Ideas

These ideas are intentionally staged after the core rails are stable:

1. **Harness Rail**: record agent failures and turn them into rules, checks or docs.
2. **Context Expert Router**: route tasks to specialized context bundles.
3. **Agent Docs Linter**: keep `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and Cursor rules short and useful.
4. **Auth Rail**: optional agent-readable auth docs and redaction checks.
5. **UI/Report Rail**: local HTML dashboard and optional MCP Apps/AG-UI-style event outputs.
6. **Gateway Lite**: local event routing only after memory, context selection, policy and reports are mature.
