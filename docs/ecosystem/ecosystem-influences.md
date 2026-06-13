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

## 2026 External Project Audit Update

The latest roadmap update reviewed a focused set of agent-infrastructure repositories and posts. The detailed audit lives in [`external-projects-audit.md`](external-projects-audit.md).

Main conclusion:

```txt
Agent hosts are converging on context, tools, skills, MCP, specs, memory, reports, dashboards and governance.
SotuRail should remain the local rail layer that prepares those artifacts for any host.
```

### Projects Reviewed

| Project | Pattern to absorb | Planned SotuRail rail |
| --- | --- | --- |
| `google-labs-code/design.md` | agent-readable design tokens and rules | Design Rail |
| `anomalyco/opencode` | open-source coding-agent host | Host Compatibility Rail |
| `henriquesantanati/openclaude` | Claude-compatible host pattern | generic/Claude-compatible host export |
| `henriquesantanati/mermaid` | diagram tooling | Diagram Rail render/diff polish |
| `langchain-ai/deepagents` | subagents, filesystem, memory, HITL and skills | role packs and Deep Agents-style export |
| `JulioCRFilho/mermaid-diagram-driven-development` | PRD/requirements/design/tasks + visual contracts | Spec, Design And Diagram Rail |
| `darkhucx/claude-code-harness` | acceptance harness discipline | Harness Rail contracts and evidence gates |
| `henrysssilveira/MCP-Host-Universal` | universal MCP host boundary | read-only MCP manifests and policy reports |
| `Lum1104/Understand-Anything` | knowledge graph and codebase tours | Knowledge Graph Rail |
| `renanrdev/dumps` | redacted CLI evidence sharing | redacted evidence bundle concept |
| `murillo-romeu/sonar-totvs` | domain-specific skill/report | Skill Rail 2.0 |
| `Acauhi99/opencode-agent-system` | OpenCode agent system packaging | OpenCode export and role/skill packaging |
| `ComposioHQ/composio` | tool/provider integration ecosystem | compatibility manifests, not marketplace cloning |
| Hermes Agent | self-improving agent runtime, skills, routines, subagents and trajectory compression | context optimization, role packs and tasklet inspiration without becoming the runtime |
| Odysseus | self-hosted AI workspace, runtime, UI and local services | local dashboard, host-fit and evidence-report inspiration without adding a required server |

### Product Rule

SotuRail should absorb the durable patterns and avoid cloning products:

- Host Compatibility Rail should support external hosts but not become a host.
- Design Rail should validate local design guidance but not become a design platform.
- Knowledge Graph Rail should explain local code/docs evidence but not require cloud embeddings.
- Skill Rail 2.0 should package safe domain skills but not hide risky commands.
- Governance And Cost Rail should warn about context/workflow risk but not claim provider billing accuracy without evidence.

### Hermes Agent And Odysseus Boundary

Hermes and Odysseus reinforce why SotuRail must distinguish agents from harness components:

```txt
Agent = model + tools + state/memory + decision/execution loop.
SotuRail = local context, harness, evidence, policy and host handoff layer.
```

Hermes contributes useful inspiration for trajectory compression, session search, toolset profiles, skills and subagent role packs. Odysseus contributes useful inspiration for local dashboard cards, host fit checks, visual evidence reports and privacy/security documentation.

SotuRail does not copy their runtime, chat UI, model serving, local-service stack or central shell behavior. See [`agent-harness-synthesis-2026.md`](agent-harness-synthesis-2026.md), [`security-boundaries.md`](../security/security-boundaries.md) and [`conductor-mode.md`](conductor-mode.md).

## 2026 Agent Runtime Update

Newer agent hosts are converging around the same architecture: a coding agent surface, local or cloud workspaces, MCP or tool adapters, reusable skills/instructions, hooks/approvals, context budgeting and evidence that proves the task is actually complete.

SotuRail should absorb this as a product map:

```txt
agent host = model + planning loop + editing/runtime surface
SotuRail = local context + rules + budget + skills + workspace + harness evidence + safety reports
```

See [`roadmap-agent-runtime-addendum.md`](../roadmap/roadmap-agent-runtime-addendum.md) for the updated rail plan.

### Host-Aware Agent Runtime Patterns

Claude Code, Codex, Gemini CLI, Cursor, Antigravity and future coding-agent hosts should be treated as different runtime surfaces, not as one generic prompt box.

What to add to SotuRail:

- **Agent Runtime Adapter**: host-aware exports for instructions, context packs, skills, hooks, MCP and prompt-only fallback.
- `soturail agents capabilities` to explain what each host can safely consume.
- `soturail agents explain --agent all` to show what is being sent, referenced or kept local.
- Avoid claiming direct host support until the export path and docs are verified.

Where it maps:

- `agents export`
- `agents doctor`
- `context pack`
- `skills export`
- `mcp config`
- `policy doctor`

### MCP vs Agent Skills Boundary

MCP and Agent Skills should not be mixed together.

```txt
MCP = external capability boundary: tools, resources, prompts, roots and integrations.
Skill = reusable local operating procedure: instructions, scripts, references and assets.
Context pack = selected evidence for one task or role.
Policy = what is safe to expose or execute.
Harness = what must pass before work is accepted.
```

What to add to SotuRail:

- **MCP Exposure Rail**: report every exposed tool/resource/prompt/root and its local risk.
- **Skill Boundary Rail**: keep skills small, routed and task-specific instead of always-loaded context.
- `soturail mcp exposure` and `soturail skills route --task "..."`.
- Host-aware warnings when a target supports prompt files but not real skills, hooks or MCP.

Where it maps:

- `mcp smoke`
- `mcp manifest`
- `skills validate`
- `skills route`
- `agents export`
- `policy validate`

### Context Budgeting As A First-Class Rail

Practical agent usage now depends heavily on context size, repeated tool calls, large instruction files, MCP overhead, skills and long session history.

What to add to SotuRail:

- **Context Budget Rail**: estimate context cost drivers before agent handoff.
- Warn about huge `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, copied logs, giant JSON, broad MCP exposure and always-loaded skills.
- Suggest `context prune`, `context offload`, `format --mode concise`, role packs and smaller root agent docs.
- Report stable blocks vs dynamic blocks so prompt-cache-friendly output stays predictable.

Where it maps:

- `context pack`
- `context select`
- `context prune`
- `context offload`
- `agents lint`
- `format`
- `bench`

### Per-Run Staging Without Kubernetes

Leoflow-style per-run staging volumes reinforce a useful workflow idea: one execution should have one isolated place for inputs, outputs, intermediate files and evidence.

SotuRail should not become a Kubernetes PVC orchestrator. The local equivalent is enough:

```txt
.soturail/runs/<run-id>/
  input/
  output/
  raw/
  offload/
  artifacts/
  evidence/
  workspace.json
  summary.md
  handoff.md
```

What to add to SotuRail:

- **Run Workspace Rail**: local per-run workspaces with TTL cleanup and safe previews.
- Link run workspaces to workflow ids, raw ids, offload ids, policy decisions and evidence packs.
- Keep generated artifacts off the prompt unless selected or summarized.

Where it maps:

- `workflow`
- `run`
- `expand`
- `context offload`
- `fs snapshot`
- `report`

### Reverse Specification Extraction

Reversa-style reverse documentation points to a strong SotuRail direction: turn existing code, docs, config and logs into claims, rules, specs, gaps and validation tasks.

What to add to SotuRail:

- **Reverse Specification Rail**: `reverse scan`, `reverse claims`, `reverse specs`, `reverse gaps` and `reverse export`.
- Claim records with source path, confidence, evidence and validation status.
- Rules and specs should not be invented without source evidence.
- Gaps should be explicit so humans know what the agent could not prove.

Where it maps:

- `ingest`
- `rules`
- `memory`
- `spec`
- `Project Brain`
- `harness doctor`

### Acceptance Harness Contracts

Agent work should not be accepted because the model says it is done. A local harness contract should decide whether work is accepted.

What to add to SotuRail:

- **Acceptance Harness Contracts**: build, typecheck, lint, tests, coverage, docs, policy and release-pack gates.
- `soturail harness contract init` and `soturail harness contract check`.
- Failure records should become candidate rules, docs, memory or workflow checks.
- Evidence packs should include which gate failed or passed.

Where it maps:

- `workflow verify`
- `harness note`
- `policy doctor`
- `fs diff`
- `report`
- `release evidence`

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
  - memory expert: approved memory and historical decisions;
  - research expert: ecosystem notes, citations and comparison constraints.
- `soturail context route --query "..."` as a later alias or layer over `context select`.
- Route reports showing which expert was selected, what was omitted and why.

Where it maps:

- `context select`
- `context prune`
- `memory recall`
- `rules search`
- `workflow trace`
- `bench context-quality`

## Deep Agents And Sub-Agent Patterns

Deep agent frameworks emphasize task planning, scoped sub-agents, filesystem state, tool loops, durable working memory, human approval, skills and context offloading.

What to add to SotuRail:

- Keep SotuRail as the rail layer, not the autonomous agent runtime.
- Add safer task handoff artifacts for agents:
  - planner context pack;
  - executor context pack;
  - reviewer context pack;
  - release-manager context pack;
  - researcher context pack.
- Add workflow templates that split complex work into plan, implementation, review and verification records.
- Add report output that says which context pack was meant for which role.
- Add `context offload` / `context restore` so long logs and tool outputs can stay local with recovery pointers.
- Add filesystem evidence commands such as `fs snapshot`, `fs diff`, `fs touched` and `fs plan-edit` so agents can review changed files without SotuRail becoming the editing agent.
- Add policy approval queues for risky commands, raw expansion, publish/release actions and config writes.
- Add role-aware skill suggestions and exports.
- Add experimental future exports for `deepagents` and `deepagents-js` as context/config artifacts only.

Where it maps:

- `workflow`
- `skills`
- `agents export`
- `context pack`
- `context offload`
- `policy queue`
- `fs snapshot`
- `trace`
- `report`

See [deep-agents-patterns.md](../rails/hosts/deep-agents-patterns.md).

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
- Role-based workflow phases should connect to role context packs.

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
  - role packs;
  - policy approvals;
  - filesystem evidence;
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
- Add role-pack quality fixtures where each role receives only its necessary context.
- Add offload/restore fixtures where full raw evidence remains recoverable.
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
- `policy queue`, `policy approve` and `policy reject` for risky local actions.
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

1. **Run Workspace Rail**: isolated per-run folders for inputs, outputs, raw logs, artifacts and evidence.
2. **Context Budget Rail**: estimate and explain context drivers before handoff.
3. **MCP Exposure Rail**: show exposed MCP capabilities and risks.
4. **Skill Boundary Rail**: route skills based on task, role and host capability.
5. **Acceptance Harness Contracts**: require concrete checks before accepting agent work.
6. **Harness Rail**: record agent failures and turn them into rules, checks or docs.
7. **Context Expert Router**: route tasks to specialized context bundles.
8. **Role Pack Rail**: planner/executor/reviewer/release-manager/researcher context packs.
9. **Context Offload Rail**: keep long tool outputs on disk with summaries and recovery IDs.
10. **Filesystem Evidence Rail**: snapshots, touched files and workflow diffs.
11. **Policy Approval Queue**: human review for risky commands and config changes.
12. **Skill Router**: suggest skills based on task, role and policy.
13. **Agent Docs Linter**: keep `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and Cursor rules short and useful.
14. **Reverse Specification Rail**: convert code/docs into claims, rules, specs, gaps and validation tasks.
15. **Auth Rail**: optional agent-readable auth docs and redaction checks.
16. **UI/Report Rail**: local HTML dashboard and optional MCP Apps/AG-UI-style event outputs.
17. **Gateway Lite**: local event routing only after memory, context selection, policy and reports are mature.

## 2026 Agent Harness Synthesis Update

A later review wave added QA-agent, multi-agent orchestration, pipeline-agent, self-improving harness, harness-engineering, cross-host ECC, Feynman-style provenance, book-to-skill, Tasklet and 9Router-style context-routing ideas.

See [`agent-harness-synthesis-2026.md`](agent-harness-synthesis-2026.md) for the consolidated table.

The main product update is:

```txt
SotuRail should evolve from context manager into a local harness manager:
context + state + verification + scope + lifecycle + evidence + host export.
```

New patterns to absorb:

- Agent QA with offline datasets and golden export checks.
- Validate -> fix -> verify -> report pipelines with evidence per stage.
- File-based handoff and provenance sidecars.
- Knowledge packs generated from docs, loaded on demand.
- Host router behavior for context formats, not model traffic.
- Rate-limit/fallback policy docs, not provider proxying.
- Human approval gates for improve/eval/apply loops.

Hard boundaries:

- no SoturAI/trading scope in SotuRail docs or exports;
- no mandatory provider APIs;
- no MITM/proxy/account/quota bypass features;
- no autonomous patching without approval;
- no hidden cloud telemetry.

## Coverage Checklist For The 2026 Harness Review

The reviewed materials are now mapped into SotuRail planning as follows:

| Source idea | SotuRail docs now covering it |
| --- | --- |
| QA agent with tests, datasets, CI and traces | [`agent-qa-rail.md`](../rails/evaluation/agent-qa-rail.md), [`eval-datasets.md`](../rails/evaluation/eval-datasets.md), [`golden-agent-tests.md`](../rails/evaluation/golden-agent-tests.md), [`llm-as-judge-policy.md`](../rails/evaluation/llm-as-judge-policy.md) |
| CrewAI/LiteLLM-style roles, fallback and rate limits | [`multi-agent-workflow-templates.md`](../rails/tasklets/multi-agent-workflow-templates.md), [`resilience-rail.md`](../rails/governance/resilience-rail.md), [`rate-limit-and-fallback-policy.md`](../rails/governance/rate-limit-and-fallback-policy.md) |
| Validate -> fix -> verify -> report agent pipeline | [`observability-rail.md`](../architecture/observability-rail.md), [`workflow-rail.md`](../rails/harness/workflow-rail.md), [`examples/workflows/agent-pipeline-workflow.md`](../../examples/workflows/agent-pipeline-workflow.md) |
| OpenTracy-style trace, ledger, approval and experiments | [`agent-governance-rail.md`](../rails/governance/agent-governance-rail.md), [`evidence-provenance-rail.md`](../rails/evidence/evidence-provenance-rail.md) |
| Harness engineering lifecycle | [`harness-lifecycle-rail.md`](../rails/harness/harness-lifecycle-rail.md), [`harness-rail.md`](../rails/harness/harness-rail.md), [`workflow-rail.md`](../rails/harness/workflow-rail.md) |
| ECC-style cross-host harness, doctor, audit and skills | [`host-compatibility-rail.md`](../rails/hosts/host-compatibility-rail.md), [`agent-hosts.md`](../rails/hosts/agent-hosts.md), [`skill-rail-2.md`](../rails/skills/skill-rail-2.md), [`future-rails-index.md`](../roadmap/future-rails-index.md) |
| Feynman-style provenance and verifier status | [`evidence-provenance-rail.md`](../rails/evidence/evidence-provenance-rail.md), [`report-rail.md`](../rails/evidence/report-rail.md) |
| book-to-skill-style document-to-skill packs | [`knowledge-rail.md`](../rails/knowledge/knowledge-rail.md), [`skill-rail-2.md`](../rails/skills/skill-rail-2.md), [`context-packs.md`](../rails/context/context-packs.md) |
| Tasklet-style small reusable task blocks | [`tasklet-rail.md`](../rails/tasklets/tasklet-rail.md), [`workflow-rail.md`](../rails/harness/workflow-rail.md) |
| 9Router-style router metaphor and token/context savings | [`host-router-rail.md`](../rails/hosts/host-router-rail.md), [`context-packs.md`](../rails/context/context-packs.md), [`governance-cost-rail.md`](../rails/governance/governance-cost-rail.md) |

This checklist is intentionally documentation-only. Runtime implementation should happen gradually through roadmap milestones and tests.
