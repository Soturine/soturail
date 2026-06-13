# Roadmap

SotuRail is evolving toward a local-first Context OS for AI coding agents: context packs, reducers, dedupe, memory, MCP resources, agent exports, workflows, governance, reports and safe release gates in one small CLI.

This roadmap keeps the historical plan intact while updating the next major direction after the v0.4.x agent-integration milestone.

## Product Identity

SotuRail should stay small, local-first and plug-in friendly.

- SotuRail is not the agent.
- SotuRail is not a heavy production gateway.
- SotuRail is not a Claude-only harness.
- SotuRail is not a Mermaid-only workflow tool.
- SotuRail is the local rail layer that gives agents better context, memory, compression, safety, logs, workflows, diagrams, structured payloads and release evidence.

Useful mental model:

```txt
Hermes-like systems: the agent brain and execution loop.
Deep Agents-style systems: the batteries-included harness with sub-agents, tools, filesystem, memory and approvals.
Claude Code Harness-style systems: disciplined setup/plan/work/review/release loops with guardrails and evidence.
MDDD-style systems: Mermaid/.spec.md visual contracts before implementation.
Plano-like systems: the gateway, router and production data plane.
SotuRail: the local Context OS that prepares, filters, formats, remembers, governs and reports what agents need.
```

Hermes Agent and Odysseus sharpen this boundary:

```txt
Hermes = self-improving personal agent runtime.
Odysseus = workspace + runtime + agent + UI + local services.
SotuRail = local-first context/harness OS for preparing and governing agents.
```

The optional future **SotuRail Conductor** may coordinate planning, verification, review, tasklets and evidence behind approval gates. It is not implemented in v1.4.0 and must not replace the stable CLI-first Core.

Newer v0.5+ planning model:

```txt
Dense-agent setup: every task gets every instruction, file and rule.
SotuRail setup: route the task to the right local context expert, memory, role pack, rule set, diagram, payload format and workflow evidence.
```

## Roadmap Policy

- Prefer small patch releases after large feature releases.
- Do not publish a GitHub release before the npm package is published successfully.
- Keep runtime usage clean: `npm audit --omit=dev` must remain at `0 vulnerabilities` before publish.
- Treat full-audit Vitest/Vite/esbuild findings as dev-only unless they affect packed/runtime users.
- Do not expose arbitrary shell execution through MCP by default.
- Keep native acceleration optional. A TypeScript fallback must always work.
- Do not claim SotuRail is faster or more accurate than adjacent projects without reproducible benchmarks.
- Every major feature should have clean-folder smoke tests, Windows coverage, docs, release notes, and package/CLI version verification.
- Do not turn SotuRail into a LangChain, LangGraph, Deep Agents, CrewAI, Claude plugin, Mermaid-only CLI or gateway clone. SotuRail should export rails and evidence that those systems can consume.
- New planned rails should be staged across versions instead of overloading a single release.

## Strategic Influences To Absorb, Not Copy

The next stages are influenced by the broader context-engineering and agent-infrastructure ecosystem. SotuRail should absorb patterns, not vendor or clone other projects.

See also:

- [docs/ecosystem/comparisons.md](docs/ecosystem/comparisons.md)
- [docs/ecosystem/ecosystem-influences.md](docs/ecosystem/ecosystem-influences.md)
- [docs/rails/hosts/deep-agents-patterns.md](docs/rails/hosts/deep-agents-patterns.md)
- [docs/rails/harness/harness-rail.md](docs/rails/harness/harness-rail.md)
- [docs/rails/governance/policy-rail.md](docs/rails/governance/policy-rail.md)
- [docs/rails/design/diagram-rail.md](docs/rails/design/diagram-rail.md)
- [docs/rails/context/structured-payload-rail.md](docs/rails/context/structured-payload-rail.md)
- [docs/rails/hosts/agent-docs-hygiene.md](docs/rails/hosts/agent-docs-hygiene.md)
- [docs/roadmap/roadmap-harness-diagram-payload-addendum.md](docs/roadmap/roadmap-harness-diagram-payload-addendum.md)
- [docs/ecosystem/external-projects-audit.md](docs/ecosystem/external-projects-audit.md)
- [docs/ecosystem/agent-harness-synthesis-2026.md](docs/ecosystem/agent-harness-synthesis-2026.md)
- [docs/rails/evaluation/agent-qa-rail.md](docs/rails/evaluation/agent-qa-rail.md)
- [docs/rails/evidence/evidence-provenance-rail.md](docs/rails/evidence/evidence-provenance-rail.md)
- [docs/rails/knowledge/knowledge-rail.md](docs/rails/knowledge/knowledge-rail.md)
- [docs/rails/governance/resilience-rail.md](docs/rails/governance/resilience-rail.md)
- [docs/rails/hosts/host-router-rail.md](docs/rails/hosts/host-router-rail.md)
- [docs/rails/tasklets/tasklet-rail.md](docs/rails/tasklets/tasklet-rail.md)
- [docs/rails/hosts/host-compatibility-rail.md](docs/rails/hosts/host-compatibility-rail.md)
- [docs/rails/design/design-rail.md](docs/rails/design/design-rail.md)
- [docs/rails/knowledge/knowledge-graph-rail.md](docs/rails/knowledge/knowledge-graph-rail.md)
- [docs/rails/skills/skill-rail-2.md](docs/rails/skills/skill-rail-2.md)
- [docs/rails/governance/governance-cost-rail.md](docs/rails/governance/governance-cost-rail.md)
- [docs/ecosystem/agent-harness-synthesis-2026.md](docs/ecosystem/agent-harness-synthesis-2026.md)
- [docs/rails/harness/harness-lifecycle-rail.md](docs/rails/harness/harness-lifecycle-rail.md)
- [docs/security/security-boundaries.md](docs/security/security-boundaries.md)
- [docs/ecosystem/conductor-mode.md](docs/ecosystem/conductor-mode.md)

### Agent Brain Patterns

Inspired by Hermes-style and Deep Agents-style agent systems:

- memory across sessions;
- compact tool definitions;
- session and trajectory summaries;
- curated skills;
- safe sub-agent/task handoff ideas;
- explicit action and observation evidence;
- filesystem evidence around changes;
- human approval queues for risky tool calls.

SotuRail should use these ideas to improve `memory`, `skills`, `workflow`, `policy`, `context`, `trace` and `report` rails, not to become a full autonomous agent runtime.

### Gateway And Observability Patterns

Inspired by Plano-style agent infrastructure:

- agent capability matrix;
- local traces;
- guardrails before agent handoff;
- workflow observability;
- event-like records for commands, context packs, memory recall and agent exports.

SotuRail should keep this local and lightweight first. A future gateway mode can be explored only after memory, context selection, policy, evidence and reports are stable.

### Compression And Context Patterns

Inspired by Squeez/SQZ, RTK, LLMLingua, TOON, SWE-pruning and benchmark-driven context work:

- compress structure, not meaning;
- preserve errors, paths, exact values and security warnings;
- select context by query and reason, not only by file size;
- measure quality, not only token savings;
- provide deterministic compact formats when JSON/Markdown are too verbose.

### Structured Payload Patterns

Inspired by tagged-prompt practices, XML-like prompt boundaries, JSON safety discussions and TOON-style compact data:

- JSON remains the machine/config/MCP/tool-contract format.
- Markdown remains the human documentation format.
- XML-like tagged blocks can delimit long LLM prompt context.
- TOON/table-like formats can reduce repetitive structured data.
- Mermaid can represent visual workflow, architecture and state context.
- Duplicate JSON keys, giant arrays, probable secrets and ambiguous machine payloads should be detected before they become agent prompt context.

### Agent Harness And Deep Agents Patterns

Inspired by agent harness engineering, Claude Code Harness-style workflows, Deep Agents-style sub-agents and real community workflows:

- the useful system is model + prompts + tools + memory + traces + policies + recovery paths;
- repeated agent failures should become local rules, docs, hooks or workflow checks;
- root agent docs should be short, accurate and reference richer docs instead of becoming huge wikis;
- context should be routed like an expert system, not dumped wholesale into every session;
- sub-agent roles should receive isolated context packs, not the full repository;
- long tool outputs should be offloaded to local raw/trace storage with recovery IDs;
- filesystem changes should be snapshotted and explained instead of silently edited;
- risky commands should be explainable and reviewable before execution;
- setup/plan/work/review/release should become an optional Workflow Rail discipline;
- review perspectives should be explicit: security, quality, performance, accessibility and release.

### Diagram-Driven Development Patterns

Inspired by Mermaid Diagram Driven Development and `.spec.md` as a visual source of truth:

- diagrams should be text-based, versionable and local;
- diagrams should clarify state, sequence, policy and workflow constraints;
- `.spec.md` files can combine Markdown, Mermaid, decision matrices, requirements and acceptance criteria;
- diagrams should guide implementation, not replace tests, code review or human approval;
- SotuRail can generate workflow/release/context/policy diagrams as evidence.

### Agent UI And Protocol Patterns

Inspired by MCP UI, AG-UI and OpenUI-style ideas:

- agents increasingly need structured progress, cards, tables, approvals and live reports;
- SotuRail should start with local reports and trace pages before any heavy UI;
- future UI/event surfaces must remain safe, local and optional.

## v0.5.0 - Memory Rail, Context Intelligence, Harness Seeds And Native Reliability

This release absorbs the originally planned `v0.4.2` CI/release hotfix into the v0.5 reliability gate instead of creating a separate patch, unless an emergency production bug appears before v0.5.0.

### Reliability Gate Previously Planned As v0.4.2

- Fix or deflake Windows CI timeout around the release reliability test.
- Split heavy release/package verification from normal fast tests where needed.
- Increase Vitest timeout only for the exact long-running release/pack test.
- Keep package verification for packed `.tgz` CLI version drift.
- Ensure CI is green on Windows, Linux and macOS before release.
- Document the reason for the timeout fix in release notes.

### Memory Rail

- `soturail memory remember` for explicit long-term memory records.
- `soturail memory recall` for query-based retrieval.
- `soturail memory capture` for safe, local agent-session summaries.
- `soturail memory consolidate` for merging repeated or stale memories.
- `soturail memory doctor` for local storage, redaction and approval status.
- Memory records with source, path, confidence, tags, timestamps and privacy flags.
- Approved-memory-only mode for agent/MCP exposure.
- Redaction before storage and before MCP/resource export.
- Session summaries that record what changed, which commands ran, which raw IDs were created and which decisions were made.

### Context Intelligence

- `soturail context select --query "..."` to choose the best repo/docs/memory/rules context for a task.
- `soturail context prune` to reduce context while preserving files, line ranges and reasons.
- `soturail context offload <raw_id>` to offload long command/tool output into local evidence and return a compact recovery pointer.
- `soturail context restore <offload_id>` to recover offloaded context when a human or agent needs the full evidence.
- Local ranking that combines keyword matches, file paths, recent workflow state, approved memory and rules.
- Reasoned context output: why a file/block/memory was included.
- Token budget controls for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.
- Smaller generated `CLAUDE.md`/`AGENTS.md` with optional references to larger `agent_docs/` or `.soturail/context/` files.
- A compact structured payload mode for JSON/YAML/log-heavy context where repeated keys or repeated rows waste tokens.
- Early tagged context blocks for long LLM prompt context where boundaries matter.

### Context Expert Router

This is not a neural MoE implementation. It is a local routing metaphor: use only the context expert needed for the task.

- `soturail context route --query "..."` as a future alias/layer over `context select`.
- Built-in expert profiles:
  - code expert: source files, symbols, failing tests;
  - docs expert: README, roadmap, usage guides;
  - release expert: changelog, release notes, npm/GitHub state;
  - security expert: raw logs, redaction, policy, secrets;
  - workflow expert: current plan, tasks, verification;
  - memory expert: approved memories and historical decisions;
  - research expert: ecosystem notes, citations and comparison constraints.
- Output should include selected expert, included evidence, omitted context and reason.

### Role-Based Context Packs

Inspired by sub-agent systems, SotuRail should generate role-specific context bundles while staying independent from any agent runtime.

- `soturail context pack --role planner`.
- `soturail context pack --role executor`.
- `soturail context pack --role reviewer`.
- `soturail context pack --role release-manager`.
- `soturail context pack --role researcher`.
- Each role pack should declare purpose, included sources, omitted sources, token estimate and recovery pointers.
- Role packs should be exportable through `agents export` and attachable to workflow phases.

Suggested mapping:

- planner: roadmap, PRD, specs, constraints, previous decisions;
- executor: task, target files, repo map, failing tests, safe commands;
- reviewer: diff, tests, rules, acceptance criteria, security notes;
- release-manager: version, changelog, release notes, pack, npm/GitHub state;
- researcher: docs, ecosystem influence notes, comparison constraints and citations.

### Harness Failure Ledger

- `soturail harness note "..."` to record an agent mistake, repeated bug, missed test or bad context decision.
- `soturail harness doctor` to check whether a project has enough rails: short agent docs, safe hooks, context packs, MCP smoke, workflow verification and release evidence.
- Convert harness notes into candidate rules, docs, memory records or workflow verification items.
- Link failures to evidence: raw IDs, commands, files, workflow IDs and release reports.

### Early Evidence Pack

- Record enough evidence for workflows and releases to be audited later.
- Attach command raw IDs, offload IDs, workflow IDs, changed files, policy decisions and release checks where available.
- Prepare later commands:
  - `soturail workflow evidence <id>`;
  - `soturail release evidence`.

### Filesystem Evidence Rail

This is inspired by agent harnesses with filesystem access, but SotuRail should stay evidence-focused rather than becoming an editing agent.

- `soturail fs snapshot` to record current file state for a workflow.
- `soturail fs diff` to summarize changed files and important hunks.
- `soturail fs touched` to list files changed since a workflow started.
- `soturail fs plan-edit` to describe intended edits before an agent or user changes files.
- Connect filesystem evidence to workflow IDs, raw IDs and command traces.

### Policy Approval Queue

- `soturail policy queue` to list pending risky actions.
- `soturail policy approve <id>` for explicit human approval.
- `soturail policy reject <id>` for explicit human rejection.
- `soturail policy explain <id>` to show command, risk, reason, evidence and safer alternatives.
- Good first gated actions: npm publish, GitHub release, global config write, raw log expansion, destructive shell command, MCP exposure change.

### Skills Routing

- `soturail skills suggest --query "..."` to recommend a relevant skill.
- `soturail skills route --task "..."` to pair a skill with a context expert, role pack and policy checks.
- `soturail skills export --role reviewer` or similar role-aware export.
- Output must explain why the skill was selected and what evidence it should receive.

### Agent Docs Hygiene

- `soturail agents lint` to warn when `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` or Cursor rules are too long, stale or missing key project facts.
- `soturail agents split-context` to suggest moving large details into `agent_docs/` or `.soturail/context/`.
- Keep root agent files short and reference-based.
- Explain what each host receives and what remains as linked context.

### Policy And Governance Rail

- `soturail policy doctor` for local safety checks.
- `soturail policy validate` for project policy files.
- `soturail policy explain` to show why a command, export or MCP resource is allowed or denied.
- `soturail policy auth-check` for projects that need agent-readable auth docs.
- Optional `AUTH.md` / `docs/auth.md` scaffold for safe auth setup notes.
- Local policy checks for secrets, unsafe raw expansion and MCP resource exposure.
- Maintain default safe behavior: raw logs require explicit `--allow-raw --yes` style confirmation.
- Add docs comparing SotuRail memory/context behavior with agent-memory style tools without claiming unsupported superiority.

### Native Reliability, Not Native-Only

- Improve optional native reducer hot paths only where benchmarks prove a bottleneck.
- Add TypeScript vs native benchmark reports.
- Keep Rust/native binaries optional.
- Keep npm install working without Rust, Cargo or native build tools.
- Expand `soturail native doctor` and fallback diagnostics.

## v0.5.1 - Memory, Context, Payload And Agent Docs Polish

- Improve `memory recall` output readability.
- Add examples for project decisions, bug history, recurring test failures and architecture preferences.
- Add clean-folder smoke tests for memory/context flows.
- Improve stale-memory detection and dedupe.
- Improve docs for small `CLAUDE.md` plus larger referenced context files.
- Add migration notes for users coming from v0.4.x.
- Add safer export examples for approved memory only.
- Add `agents lint` docs and examples.
- Add role-pack examples for planner, executor, reviewer, release-manager and researcher.
- Add `AUTH.md` scaffold docs if the policy/auth-check work lands in v0.5.0.
- Add Structured Payload Rail docs and examples for Markdown, JSON, tagged context and compact table/TOON-like output.
- Add light `soturail validate json <file> --strict` seed/tests for duplicate keys and invalid prompt payloads.
- Add light `soturail format compare <file>` seed for Markdown vs tagged vs JSON vs compact output.
- Add early Diagram Rail docs and basic Mermaid validation plan.
- Add Agent Docs Hygiene docs for short root files and referenced rich context.

## v0.5.2 - CI Stabilization And Lightweight Quality Fixtures

- Fix stale tests from v0.4.x/v0.5.x version drift.
- Make release metadata tests version-aware instead of hardcoding old versions.
- Make agent doctor tests validate stable behavior without depending on old exact wording.
- Add lightweight quality fixtures for JSON strict validation, format comparison, context routing, context budget, run workspace output, workflow evidence and agent docs hygiene.
- Keep tests small, deterministic, local and cheap enough for normal CI.
- Do not add the full evaluation harness yet.
- Do not add benchmark-heavy jobs or network/provider-dependent checks.
- Prepare the full evaluation suite for v0.6.1 after v0.6.0 agent-runtime integration lands.

## v0.6.0 - Real Agent Runtime Integration

- `soturail agents install --agent claude --dry-run`.
- `soturail agents install --agent cursor --dry-run`.
- `soturail agents install --agent gemini --dry-run`.
- `soturail agents status` and `soturail agents doctor --verbose`.
- `soturail agents capabilities` for a host capability matrix.
- Experimental `deepagents` and `deepagents-js` export targets as prompt/config/context outputs only.
- Safer backups before modifying agent config files.
- Host capability matrix for Claude Code, Codex, Gemini CLI, Cursor, Antigravity, OpenCode/Amp/Kiro-style hosts, Deep Agents-style harnesses and generic agents.
- Prompt-only fallback remains available for every host.
- Codex, Antigravity and Deep Agents-style targets stay conservative until stable hook/config surfaces are confirmed.
- Add host-specific docs for short agent files, rules, settings, hooks, role packs and context pack exports.
- Add optional Claude Code Harness-style compatibility notes without requiring SotuRail to become a Claude plugin.
- Add host-aware payload-format recommendations: Markdown, JSON, tagged blocks and prompt-only fallbacks.
- Add host-aware policy notes for config writes, hooks, MCP exposure and raw-log access.

## v0.6.1 - Agent UX Polish And Full Evaluation Suite

Status: implemented in the v0.6.1 local release prep. The suite is local, deterministic and does not require network access, paid APIs or real agent hosts.

- Better `agents doctor` messages.
- Better copy/paste setup examples per host.
- Tutorial: SotuRail with Claude Code.
- Tutorial: SotuRail with Codex.
- Tutorial: SotuRail with Gemini CLI.
- Tutorial: SotuRail with Cursor.
- Tutorial: SotuRail with Antigravity prompt-only workflow.
- Tutorial: SotuRail with Deep Agents-style role packs.
- Tutorial: short `CLAUDE.md` plus `agent_docs/` references.
- Tutorial: SotuRail with harness-style setup/plan/work/review/release workflow.
- Tutorial: SotuRail with Diagram Rail and `.spec.md` visual contracts.
- Tutorial: choosing context formats for Claude, Gemini, Codex, Cursor and MCP.
- Add benchmark cases for memory recall quality.
- Add benchmark cases for context selection quality.
- Measure not only token savings, but whether selected context preserves the correct file, error, command and rule.
- Add reducer quality checks for npm, Vitest, tsc, Java, Maven/Gradle, Docker, git diff, git status, ESLint and Vite/Next output.
- Add before/after reports for raw context vs selected/pruned context.
- Add local evaluation fixtures inspired by long-code and SWE-style bug workflows without requiring paid APIs.
- Add context-router quality fixtures: the selected expert must match the task type and preserve expected evidence.
- Add role-pack quality fixtures: planner/executor/reviewer/release-manager packs must not receive unrelated context by default.
- Add agent-doc hygiene fixtures: short root docs plus referenced larger docs should pass.
- Add offload/restore fixtures: summaries must preserve recovery pointers and critical failure lines.
- Add format quality fixtures: Markdown vs tagged vs JSON vs TOON/table-like output must preserve critical evidence.
- Add strict JSON fixtures: duplicate keys, probable secrets, huge arrays and invalid machine payloads must be detected.
- Add evidence-pack fixtures: workflow/release evidence must include expected commands, raw IDs, changed files and policy decisions.
- Add harness scenario fixtures: repeated agent failures should become candidate rules, docs, memory or workflow checks.
- Add diagram validation fixtures: invalid Mermaid, unreachable states and missing verification transitions should fail clearly.
- Optional benchmark reports should stay local and reproducible by default.

## v0.7.0 - Workflow Rail 2.0, Harness Rail And Diagram Rail

- Workflow templates for `setup -> plan -> work -> review -> verify -> evidence`.
- `soturail workflow setup`.
- `soturail workflow plan "Task title"`.
- `soturail workflow work`.
- `soturail workflow review --all`.
- `soturail workflow verify`.
- `soturail workflow evidence <id>`.
- `soturail workflow diagram <id>`.
- Future `workflow tasks`, `workflow issue`, `workflow tdd`, `workflow release`, `workflow trace`, `workflow report` and `workflow scaffold` commands can build on the v0.7 storage model.
- Optional GitHub Issues integration remains future work.
- Worktree-per-task workflows with verification checklists.
- Release workflow reports that connect tests, build, audit, pack and npm/GitHub release state.
- Role-based context packs for planner, executor, reviewer, release-manager and researcher.
- Sub-agent-style workflow phases without requiring a specific agent runtime.
- Phase traces that record which role pack, skill, memory recall, commands and raw IDs were used.

### Harness Rail Expansion

- `soturail workflow setup`.
- `soturail workflow work`.
- `soturail workflow review`.
- `soturail workflow evidence <id>`.
- Release evidence through `soturail workflow evidence <id>` and release preflight.
- Review perspectives:
  - `soturail workflow review --perspective security`;
  - `soturail workflow review --perspective docs`;
  - `soturail workflow review --perspective tests`;
  - `soturail workflow review --perspective release`;
  - `soturail workflow review --perspective context`;
  - `soturail workflow review --perspective agent-readiness`;
  - `soturail workflow review --all`.
- Evidence packs with build, tests, audit, npm pack, changed files, raw IDs, offload IDs, release notes and policy approvals.
- Harness Failure Ledger integration with workflow verification.

### Diagram Rail Expansion

- `soturail diagram init`.
- `soturail diagram new <feature>`.
- `soturail diagram audit <file>`.
- `soturail diagram validate`.
- `soturail diagram from-workflow <id>`.
- `soturail workflow diagram <id>`.
- Mermaid workflow diagrams for states, release flows, policy flows, MCP flows and context-router flows.
- `.spec.md` visual contracts with Mermaid, decision matrix, requirements, acceptance criteria and test plan.
- Diagram validation for invalid Mermaid syntax, unreachable states, missing verification, unlabeled risky transitions and release paths without evidence.
- Future `diagram sync` and `diagram from-repo` commands can be added after v0.7.0.

## v0.8.0 - Verified Project Brain And Reverse Specification Rail

- Add local Project Brain storage under `.soturail/brain/`.
- Use JSONL records for claims, decisions, bugs, gaps, rules and stale events.
- Use JSON materialized views for project profile, architecture, brain index, freshness and doctor reports.
- Add `soturail brain init`.
- Add `soturail brain scan`.
- Add `soturail brain profile`.
- Add `soturail brain recall "query"`.
- Add `soturail brain stale`.
- Add `soturail brain doctor`.
- Add `soturail brain export --agent claude|codex|gemini|cursor|generic`.
- Add Reverse Specification Rail commands: `reverse scan`, `reverse claims`, `reverse specs`, `reverse gaps` and `reverse export --target agent`.
- Add `soturail rules from-brain` and `soturail rules doctor`.
- Add `soturail eval run --suite brain`.
- Keep extraction deterministic: no LLM calls, embeddings, cloud services or external databases.
- Connect workflow evidence with Project Brain claim/gap/stale counts.
- Connect harness failures to brain bug/rule candidates.
- Connect agent exports with Project Brain brief guidance.

## v0.8.1 - Project Brain Polish And Knowledge Quality

- Improve source-range matching with local relocation candidates when evidence moves inside the same file.
- Add duplicate and near-duplicate claim consolidation reports without deleting append-only history.
- Add stale-evidence repair guidance through `brain stale --repair-plan` and `brain doctor --repair-plan`.
- Improve agent briefs so verified, suspect and stale records are separated and bounded by default.
- Make `rules from-brain` safer: stale/suspect claims do not create active rules by default, and all rules link to claim or decision IDs.
- Improve `brain doctor` with duplicate groups, integration status, repair-plan paths and actionable next commands.
- Add stronger brain quality fixtures for dedupe, repair plans, source relocation, rule links, brief safety and section limits.
- Improve troubleshooting docs for noisy suspect records, long briefs and weak rule derivation.
- Add v0.9.0 planning notes for benchmark categories while preserving TypeScript fallback and optional native-only work.

## v0.9.0 - Benchmark-Gated Native/Performance Engine

- Add Benchmark Rail 2.0 with `bench list`, suite-aware `bench run`, `bench compare` and `bench report`.
- Track local benchmark categories for brain scan/stale/consolidate, reverse claims, reducers, JSONL, range hashing, file scanning, workflow evidence, format comparison, JSON validation and release preflight.
- Write benchmark reports under `.soturail/bench/` and `benchmarks/reports/`.
- Add native candidate reports with `native candidates`, `native candidates --json`, `native status`, `native doctor` and `native compare`.
- Classify native candidates as `good-candidate`, `maybe-candidate`, `not-worth-it-yet` or `blocked` before any native implementation claim.
- Keep native acceleration optional; normal npm install must not require Rust or native build tools.
- Keep the TypeScript fallback mandatory and treat it as release-blocking evidence.
- Add baseline snapshot commands through `self baseline --check|--zip|--bundle|--pack` so source archives, git bundles and npm packs are produced deliberately.
- Connect benchmark, native candidate and baseline reports to workflow and release evidence.
- Document the native performance policy: no benchmark, no native rewrite.
- Defer parser/graph runtime work to later releases unless a local, heuristic, optional seed is safe.

## v0.10.0 - Local Reports, Observability And Dashboard Rail

Status: implemented in the v0.10.0 local release prep as static local artifacts first. Server mode, hosted analytics and telemetry upload remain out of scope.

- `soturail status --json|--md|--agent` for a unified local status model.
- `soturail report build`, `report latest`, `report export`, `report doctor`, `report redact`, `report github-summary`, `report agent` and `report diff`.
- `soturail dashboard build|open|doctor` for a static local dashboard without external CDN/script dependencies.
- `soturail obs collect|summary|timeline|export` for local event timelines derived from SotuRail artifacts, not shell history.
- Agent-readable reports for Codex, Claude, Gemini and generic hosts.
- Redaction/safety checks for obvious token, key and secret patterns before report handoff.
- GitHub Actions step-summary export.
- Read-only MCP report resource manifest through `soturail mcp resources report`.
- Release and workflow evidence now reference local report/status/dashboard/observability resources when present.
- Mermaid rendering, trace viewer pages and optional server mode remain future work.

## v0.10.1 - Stability, JSON Validity And v1 Readiness

Status: implemented as a stabilization release. This is not a breaking-change release and does not promise full v1.0 stability yet.

- Every `--json` output must be valid JSON parseable by `JSON.parse`.
- Status, report, MCP, benchmark, native and baseline JSON artifacts have stricter contract tests.
- Report diff, report doctor, redaction output and agent report warnings are more actionable.
- Dashboard doctor validates local report/status JSON data and keeps the dashboard static, local and dependency-free.
- Observability collection uses stable event IDs and skips duplicate local artifact events.
- Benchmark/native/baseline messages now call out stale reports, TypeScript fallback, optional native availability and clean snapshot guidance.
- Project Brain suspect/stale counts are framed as evidence freshness warnings with safe next commands.
- `soturail self schemas --check` writes schema compatibility reports under `.soturail/schemas/`.
- `soturail self readiness --v1` writes candidate v1 readiness reports under `.soturail/readiness/`.
- Stable command surface, deprecation policy and migration-to-v1 drafts are now documented.

## v1.0.0 - Stable Context OS

Status: implemented as the first stable local Context OS surface. This is a stabilization release, not a large feature dump.

Primary goals:

- finalize the stable command surface documented in `docs/reference/commands/stable-command-surface.md`;
- keep experimental commands clearly marked until promoted;
- maintain schema compatibility for `status`, `report`, `dashboard`, `obs`, `bench`, `native`, `baseline`, `mcp`, `readiness`, `code-health`, `architecture` and `agents matrix` artifacts;
- run `soturail self schemas --check --strict`, `soturail self readiness --v1 --strict`, `soturail self code-health` and `soturail release check --strict` as release gates;
- refresh Project Brain evidence before freezing v1 contracts;
- keep report/status/readiness messages clean and actionable;
- keep static local dashboard and read-only MCP report resources as the safe default;
- update onboarding docs for clean-folder use on Windows, Linux and macOS;
- keep CI green on Windows, Linux and macOS;
- avoid introducing a server mode, cloud telemetry, destructive MCP tools or native-only runtime requirements.

v1.0.0 did not attempt to ship Host Compatibility Rail, Design Rail, Knowledge Graph Rail or Skill Rail 2.0 as major new surfaces. Those rails are staged after the stable base.

## v1.1.0 - Host Compatibility Rail

Status: implemented as Host Compatibility Rail 1.0.

Inspired by OpenCode, Deep Agents-style harnesses, MCP host projects and emerging Antigravity-style agent hosts.

Goal: make SotuRail a better context/report/spec provider for external agents without becoming the agent runtime.

Delivered work:

- `soturail agents export --agent opencode` for OpenCode-compatible instructions, context packs, reports and safe next commands;
- `soturail agents export --agent antigravity` for high-priority experimental Antigravity-style host guidance and prompt-only fallback;
- `soturail agents export --agent deepagents` for DeepAgents-style role-pack and subagent-note bundles;
- `soturail agents export --agent claude|codex|gemini|gemini-legacy|cursor|generic` polish based on the v1 stable surface;
- `soturail agents matrix` with host capabilities, limitations, supported context formats, MCP support, skills support, hooks support and policy notes;
- `soturail agents doctor --host <host>` and `--all --json` to check host export safety and write per-host artifacts;
- read-only MCP host manifests that expose reports, status, brain summaries, benchmark summaries, baseline state, host exports and host doctor reports without mutation;
- docs for Gemini CLI legacy/transition notes, Antigravity-style hosts, OpenCode, DeepAgents-style role packs and generic MCP hosts;
- keep host support conservative: do not claim direct integration until export paths are verified.

Non-goals:

- do not build a new agent host;
- do not create a destructive MCP tool server;
- do not require a specific model provider;
- do not replace OpenCode, Claude Code, Codex, Cursor or Deep Agents.

## v1.1.1 - Host Compatibility Polish, Ecosystem Docs And Golden Export Checks

Status: delivered as part of the combined v1.2.0 batch.

Influenced by QA-agent, agent-pipeline, harness, router and skill-generation projects reviewed in the 2026 agent-harness synthesis.

Delivered work:

- add consolidated ecosystem docs for Agent QA, Evidence/Provenance, Knowledge, Resilience, Host Router, Tasklets and Agent Governance;
- add golden checks for agent exports and host manifests where possible;
- clarify that default evals remain offline, deterministic and provider-agnostic;
- add examples for validate -> fix -> verify -> report and multi-agent role templates;
- add host-router language for context export fallback without proxying model traffic;
- update roadmap docs so future rails are staged instead of bundled into one large release.

Non-goals:

- no provider proxy;
- no MITM bridge;
- no live billing integration;
- no required LLM-as-judge;
- no autonomous self-modifying loop;
- no mandatory server/dashboard runtime.

## v1.2.0 - Spec, Design, Diagram And Harness Lifecycle Rail

Status: Harness Lifecycle Rail implemented; additional Spec/Design/Diagram expansion remains staged.

Inspired by `design.md`, Mermaid Diagram Driven Development, spec-driven workflows, Hermes-style session handoffs and Odysseus-style local workspace organization.

Goal: make lifecycle state, specs, visual contracts and design constraints first-class local context for agents.

Delivered work:

- `soturail harness init` creates safe local lifecycle instructions, verification, scope and state files without overwriting existing content;
- `soturail harness audit [--json]` scores Instructions, State, Verification, Scope, Session Lifecycle, Host Compatibility, Evidence/Reports and Security Boundaries without running commands;
- `soturail session start|end` records bounded local session state;
- `soturail handoff generate` writes current objective, completed work, changed-file names, verification status, blockers and next steps;
- `soturail feature add|start|done|list` manages one-active-feature local state in `.soturail/state/feature_list.json`;
- deterministic golden checks keep host exports aligned with SotuRail's local-first harness identity and safe boundaries;
- Hermes and Odysseus are classified as ecosystem influences without turning SotuRail into an agent runtime or required workspace server;
- future optional SotuRail Conductor is documented as proposed and approval-gated.

Remaining planned work:

- `soturail spec init` to scaffold `PRD.md`, `requirements.md`, `design.md`, `tasks.md`, `AGENTS.md`/host rules and verification phases;
- `soturail session verify` and a dedicated `session handoff` alias to extend the implemented session lifecycle;
- multi-agent workflow templates for researcher, analyst, writer and verifier role packs;
- `soturail spec check` to validate that requirements, design notes, diagrams, tasks and acceptance criteria stay connected;
- `soturail spec plan` to turn specs into role-aware workflow tasks without executing them;
- `soturail design init` to scaffold a local `DESIGN.md` with tokens, style rules, accessibility notes and component guidance;
- `soturail design lint` for missing tokens, inconsistent names, obvious contrast/accessibility warnings and stale references;
- `soturail design diff` to explain design-token changes across releases or workflow phases;
- `soturail design export --agent <host>` to provide concise design guidance to Codex, Claude, OpenCode, Cursor, Antigravity and generic agents;
- `soturail diagram render` to generate local HTML/SVG previews where feasible;
- `soturail diagram diff` to show visual-contract changes in PR/release reports;
- connect spec/design/diagram evidence to `workflow`, `report`, `dashboard`, `project brain` and `release check`.

Rules:

- diagrams and specs guide implementation; they do not replace tests, review or human approval;
- JSON and Markdown remain source formats where appropriate;
- rendered diagrams are local artifacts, not remote services;
- design guidance must be agent-readable but not huge enough to poison context windows.

## v1.3.0 - Absorbed Into v1.4.0

v1.3.0 was not published as a separate feature release. Its Knowledge, Evidence and Evaluation scope was absorbed into v1.4.0 because knowledge packs, provenance, deterministic evals, skills and tasklets are tightly connected. A useful Skill Rail 2.0 needs knowledge compilation plus evidence and evaluation support.

The larger Knowledge Graph runtime remains planned and experimental.

## v1.4.0 - Knowledge, Evidence, Evaluation, Skills And Tasklets

Goal: turn local project sources into concise knowledge, preserve honest provenance, evaluate agent-facing artifacts, build reviewed skills and describe reusable bounded tasks.

Implemented scope:

- `soturail knowledge estimate|compile|update|verify|list`;
- `.soturail/knowledge/<name>/` packs with `SKILL.md`, topics, glossary, patterns, cheatsheet, metadata and source maps;
- `soturail evidence collect|verify|report` with explicit `verified`, `unverified`, `blocked` and `inferred` statuses;
- `soturail eval dataset init|run`, `eval golden` and `eval regression`;
- `soturail skills template|lint|eval|report|build|fold-in`;
- `soturail tasklet create|list|run --dry-run|export`;
- reorganized documentation, a concise README and local Markdown link validation.

Boundaries:

- no embeddings, cloud calls, required model provider or mandatory database;
- no unsupported verification claims;
- no autonomous tasklet execution or hidden shell commands;
- no full Knowledge Graph runtime in this release;
- provider-backed judging remains optional and outside default release gates.

## v1.5.0 - Governance, Cost, Resilience And Host Router Rail

Inspired by dynamic agent workflows, long-horizon agents, token-budget concerns and provider/tool-cost discussions.

Goal: give users local warnings and evidence before expensive or high-risk agent workflows run.

Planned work:

- `soturail budget doctor` or an equivalent report section for context size, repeated instructions, giant tool outputs, always-loaded skills, MCP exposure and long session history;
- `soturail context optimize|budget|compact` to produce full/compact/ultra context variants;
- `soturail hosts status`, `soturail export all` and `soturail export --fallback` for context-format fallback across hosts;
- `soturail agents resilience doctor` or report sections for retry/fallback/rate-limit documentation gaps;
- `soturail governance fallback-policy` and `soturail governance rate-limit` documentation/report helpers;
- workflow budget gates for dynamic/sub-agent workflows;
- policy warnings for workflows that can spawn many subagents, run long sessions or repeatedly execute tools;
- model/provider capability and cost notes stored as local config/docs, not live billing claims unless user supplies data;
- report cards for budget risk, stale context risk, MCP exposure risk and workflow depth;
- safe recommendations: prune context, offload raw logs, use role packs, reduce root agent docs, disable unmanaged dynamic workflows where appropriate, and add explicit approval gates;
- keep cost reports explicit about estimates and assumptions.

Non-goals:

- no billing integration by default;
- no live provider telemetry upload;
- no claims about provider prices without versioned evidence and user review;
- no automatic disabling of external tools without user action;
- no model-request proxy, MITM bridge, browser-token reuse, quota bypass or provider-account automation.

## v1.6.0 - Agent Governance / Evolution Rail

Inspired by self-improving harness systems, but scoped to local evidence and human approval.

Planned work:

- `soturail trace start|stop|list|show|export` for local agent/session traces;
- `soturail ledger list` and append-only decision records under `.soturail/ledger/`;
- `.soturail/policies/agent-boundary.yaml` with mutable/read-only/append-only boundaries;
- `.soturail/experiments/candidates` and `.soturail/experiments/results` for proposed changes;
- `soturail experiment create|run|compare`;
- `soturail improve propose|eval|approve|apply` with deterministic evals before approval;
- dashboard timeline cards for trace, ledger, evidence, eval and approval status.

Non-goals:

- no autonomous self-modifying loop by default;
- no patch apply without reviewable diff and explicit approval;
- no hosted control plane requirement;
- no required LLM provider.

## Later Exploration - MCP Apps, AG-UI And Gateway Lite

Future UI and gateway modes can be explored only after memory, context selection, policy, evidence, diagrams, reports and v1 stable contracts are mature.

Possible direction:

- local event records for command outputs, context selection, memory recall and workflow status;
- safe local routing between SotuRail resources and agent hosts;
- MCP Apps / MCP-UI compatible local resources for safe report visualization;
- AG-UI-style event stream only if it remains local, optional and safe;
- local cards/tables/approvals for policy queue and evidence packs;
- optional visualization of Mermaid diagrams in local reports;
- no cloud dependency by default;
- no arbitrary shell execution through MCP;
- no production proxy claims until benchmarks and real use justify them.

## Internal Module Ideas

These are not separate products yet. They are submodules that can grow inside SotuRail.

- SotuRail Memory: local approved memory for coding agents.
- SotuRail Context Select: query-aware context selection with reasons and line ranges.
- SotuRail Context Router: MoE-inspired routing to the smallest useful context expert.
- SotuRail Role Packs: planner/executor/reviewer/release-manager/researcher context bundles.
- SotuRail Context Offload: long output summaries with raw recovery pointers.
- SotuRail Filesystem Evidence: snapshots, touched files and diffs tied to workflows.
- SotuRail Policy Queue: human approval for risky commands and exports.
- SotuRail Policy Rail: inspectable safety rules, approvals, auth checks and MCP exposure reports.
- SotuRail Skill Router: task-aware skill suggestions with evidence and policy checks.
- SotuRail Harness Rail: setup/plan/work/review/release discipline, evidence packs and failure ledger.
- SotuRail Harness Ledger: repeated agent mistakes converted into rules, checks and workflow evidence.
- SotuRail Agent Docs Linter: short, useful root agent docs with referenced rich context.
- SotuRail Auth Rail: agent-readable auth docs and local redaction checks.
- SotuRail Structured Payload Rail: target-aware Markdown, JSON, tagged, TOON/table and Mermaid context outputs.
- SotuRail JSON Strict Validator: duplicate-key detection, secret warnings and prompt-payload safety checks.
- SotuRail Diagram Rail: Mermaid diagrams and `.spec.md` visual contracts for workflows, features and policies.
- SotuRail Agent Reports: what changed, what commands ran, what raw IDs exist and what to do next.
- SotuRail Project Brain: architecture, decisions, bugs, rules, diagrams and release history.
- SotuRail Local Dashboard: local reports, Mermaid rendering and trace viewer before any gateway mode.
- SotuRail Host Compatibility: host-aware exports and capability matrix for OpenCode, Antigravity, Claude, Codex, Cursor, Deep Agents-style harnesses and generic agents.
- SotuRail Spec Rail: PRD, requirements, design, tasks and acceptance criteria as agent-readable workflow inputs.
- SotuRail Design Rail: local `DESIGN.md`, design tokens, lint/diff/export and dashboard/report consistency guidance.
- SotuRail Knowledge Graph: local file/symbol/claim/decision/workflow/release graph with explain, impact and tour outputs.
- SotuRail Skill Rail 2.0: domain skill templates, validation, evaluation and role-aware exports.
- SotuRail Governance And Cost Rail: context budget, dynamic workflow guardrails, provider/model assumptions and cost-risk reports.
- SotuRail Redacted Evidence Sharing: local safe bundles for reports/logs without hosting or secret leakage.
- SotuRail Gateway Lite: future local event router after the core rails mature.

## Docs Coverage Matrix

This matrix maps implemented and planned rails to docs so the repository does not hide future work only inside the roadmap.

| Planned area | Primary docs |
| --- | --- |
| Memory Rail | `docs/rails/context/memory-rail.md`, `docs/rails/context/context-packs.md`, this roadmap |
| Context Intelligence / Router | `docs/rails/context/context-packs.md`, `docs/ecosystem/ecosystem-influences.md`, `docs/ecosystem/comparisons.md` |
| Role Packs | `docs/rails/context/context-packs.md`, `docs/rails/harness/workflow-rail.md`, `docs/rails/hosts/deep-agents-patterns.md` |
| Harness Rail / Evidence Pack | `docs/rails/harness/harness-rail.md`, `docs/rails/harness/workflow-rail.md`, `docs/roadmap/roadmap-harness-diagram-payload-addendum.md` |
| Policy Rail / Approval Queue | `docs/rails/governance/policy-rail.md`, `docs/security/security-model.md`, `docs/rails/governance/rules.md` |
| Diagram Rail / MDDD | `docs/rails/design/diagram-rail.md`, `docs/rails/design/spec-driven-workflow.md`, `docs/rails/harness/workflow-rail.md` |
| Structured Payload Rail | `docs/rails/context/structured-payload-rail.md`, `docs/rails/context/context-packs.md`, `docs/rails/governance/rules.md` |
| Agent Docs Hygiene | `docs/rails/hosts/agent-docs-hygiene.md`, `docs/rails/context/context-packs.md`, `docs/rails/harness/workflow-rail.md` |
| Reports / Observability / Dashboard | `docs/reference/commands/status-command.md`, `docs/rails/evidence/report-rail.md`, `docs/architecture/dashboard-rail.md`, `docs/architecture/observability-rail.md`, `docs/rails/evidence/agent-readable-reports.md`, `docs/rails/evidence/report-redaction.md`, `docs/rails/hosts/mcp-report-resources.md`, this roadmap |
| Host Compatibility Rail | `docs/rails/hosts/host-compatibility-rail.md`, `docs/rails/hosts/agents.md`, `docs/rails/hosts/mcp.md`, `docs/roadmap/future-rails-index.md` |
| Spec / Design / Diagram Rail | `docs/rails/design/spec-driven-workflow.md`, `docs/rails/design/design-rail.md`, `docs/rails/design/diagram-rail.md`, `docs/roadmap/future-rails-index.md` |
| Knowledge Graph Rail | `docs/rails/knowledge/knowledge-graph-rail.md`, `docs/rails/knowledge/code-graph.md`, `docs/rails/knowledge/project-brain.md`, `docs/rails/knowledge/reverse-specification-rail.md` |
| Skill Rail 2.0 / Domain Skills | `docs/rails/skills/skill-rail.md`, `docs/rails/skills/skill-rail-2.md`, `docs/rails/governance/policy-rail.md`, `docs/security/security-model.md` |
| Governance / Cost Guardrails | `docs/rails/governance/governance-cost-rail.md`, `docs/rails/governance/policy-rail.md`, `docs/rails/evidence/report-rail.md`, `docs/architecture/observability-rail.md` |
| External Project Audit | `docs/ecosystem/external-projects-audit.md`, `docs/ecosystem/ecosystem-influences.md`, `docs/ecosystem/comparisons.md` |
| Roadmap Docs Audit | `docs/roadmap/roadmap-docs-audit.md`, this roadmap |

## Historical Planned Milestones Kept From Earlier Roadmap

These entries preserve the prior roadmap history so the direction is not lost.

### v0.3.1 - Real Usage And Integration Polish

- Installed clean-folder workflow polish.
- v0.3 docs and examples scaffolded by `soturail init`.
- Richer Skill Rail starter templates and list output.
- MCP JSON-RPC smoke coverage and copyable examples.
- Hooks doctor next-step guidance.

### v0.3.2 - Strong Reducers And Deduplication

- Reducers for npm install, npm test, tsc, Vitest, Java stack traces, Maven/Gradle, git diff, git status, Docker logs, ESLint and Vite/Next build output.
- Block-level dedupe.
- Similar-output dedupe as an experimental conservative mode.
- Benchmark reports with dedupe savings, metadata overhead and net token savings.
- Packed-package verification to prevent package/CLI version drift.

### v0.4.0 - Real Agent Integrations And Workflow Rail

- Agent registry for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.
- Agent prompt/context exports.
- MCP host config helper and smoke command.
- Cursor rule export and Claude safe-hooks/MCP export.
- Workflow Rail local state machine.
- Optional local Git worktree isolation without push or merge.

### v0.4.1 - Agent Scaffold, Docs And UX Polish

- v0.4 agent and workflow docs scaffolded by `soturail init`.
- Agent and workflow examples scaffolded in clean projects.
- Version-neutral generated docs and MCP messages.
- Clearer `soturail agents doctor` next steps.
- Workflow list/show/close polish and cleanup preview.
- `.gitattributes` for reduced Windows line-ending noise.

### Former v0.5.0 - Native Performance

This previous plan is not deleted. It is folded into the new v0.5.0 as "Native Reliability, Not Native-Only" because memory and context intelligence are now the higher-value product direction.

- Rust reducer improvements.
- TypeScript vs Rust benchmark reports.
- Optional native binaries.
- No Rust required for npm install.

### Former v0.6.0 - Semantic Memory And Hardened Knowledge Ingestion

This previous plan is split across the new v0.5.0 Memory Rail and v0.8.0 Knowledge Rail.

- Hardened PDF extraction.
- Optional local embeddings for approved memory and rules.
- Stale evidence detection across richer file graphs.
- Rules search and citation workflows.

### Former v1.0.0 - Stable API And Plugin Ecosystem

This remains part of the v1.0.0 stabilization direction.

- Stable CLI and local API contracts.
- Plugin and policy pack interfaces.
- Long-term compatibility guarantees.

## Completed

- v0.4.1: agent scaffold, docs and UX polish.
- v0.4.0: real agent integrations and Workflow Rail.
- v0.3.3: package verification hotfix for packed CLI entrypoint/version drift.
- v0.3.2: strong reducers, dedupe and package verification.
- v0.3.1: real usage, integration polish and clean-folder examples.
- v0.3.0: Skill Rail, MCP and context packs, including skill validation/export, stdio resources/tools, cache-friendly context packs, hook exports and feature benchmarks.
- v0.2.3: release preflight and CLI/package version synchronization.
- v0.2.2: self-dogfooding and reliability reports.
- v0.2.1: native runner hot path, public polish and Claude hook template.
- v0.2.0: benchmarks, hooks foundation, response compression, Knowledge-to-Rules and memory approval workflow.
