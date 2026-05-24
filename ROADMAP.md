# Roadmap

SotuRail is evolving toward a local-first Context OS for AI coding agents: context packs, reducers, dedupe, memory, MCP resources, agent exports, workflows, governance, reports and safe release gates in one small CLI.

This roadmap keeps the historical plan intact while updating the next major direction after the v0.4.x agent-integration milestone.

## Product Identity

SotuRail should stay small, local-first and plug-in friendly.

- SotuRail is not the agent.
- SotuRail is not a heavy production gateway.
- SotuRail is the local rail layer that gives agents better context, memory, compression, safety, logs, workflows and release evidence.

Useful mental model:

```txt
Hermes-like systems: the agent brain and execution loop.
Plano-like systems: the gateway, router and production data plane.
SotuRail: the local Context OS that prepares, filters, remembers, governs and reports what agents need.
```

Newer v0.5 planning model:

```txt
Dense-agent setup: every task gets every instruction, file and rule.
SotuRail setup: route the task to the right local context expert, memory, rule set and workflow evidence.
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

## Strategic Influences To Absorb, Not Copy

The next stages are influenced by the broader context-engineering and agent-infrastructure ecosystem. SotuRail should absorb patterns, not vendor or clone other projects.

See also [docs/comparisons.md](docs/comparisons.md) and [docs/ecosystem-influences.md](docs/ecosystem-influences.md).

### Agent Brain Patterns

Inspired by Hermes-style agent systems:

- memory across sessions;
- compact tool definitions;
- session and trajectory summaries;
- curated skills;
- safe sub-agent/task handoff ideas;
- explicit action and observation evidence.

SotuRail should use these ideas to improve `memory`, `skills`, `workflow` and `report` rails, not to become a full autonomous agent runtime.

### Gateway And Observability Patterns

Inspired by Plano-style agent infrastructure:

- agent capability matrix;
- local traces;
- guardrails before agent handoff;
- workflow observability;
- event-like records for commands, context packs, memory recall and agent exports.

SotuRail should keep this local and lightweight first. A future gateway mode can be explored only after memory, context selection and reports are stable.

### Compression And Context Patterns

Inspired by Squeez/SQZ, RTK, LLMLingua, TOON, SWE-pruning and benchmark-driven context work:

- compress structure, not meaning;
- preserve errors, paths, exact values and security warnings;
- select context by query and reason, not only by file size;
- measure quality, not only token savings;
- provide deterministic compact formats when JSON/Markdown are too verbose.

### Agent Harness Patterns

Inspired by agent harness engineering and real community workflows:

- the useful system is model + prompts + tools + memory + traces + policies + recovery paths;
- repeated agent failures should become local rules, docs, hooks or workflow checks;
- root agent docs should be short, accurate and reference richer docs instead of becoming huge wikis;
- context should be routed like an expert system, not dumped wholesale into every session.

### Agent UI And Protocol Patterns

Inspired by MCP UI, AG-UI and OpenUI-style ideas:

- agents increasingly need structured progress, cards, tables, approvals and live reports;
- SotuRail should start with local reports and trace pages before any heavy UI;
- future UI/event surfaces must remain safe, local and optional.

## v0.5.0 - Memory Rail, Context Intelligence, Harness And Native Reliability

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
- Local ranking that combines keyword matches, file paths, recent workflow state, approved memory and rules.
- Reasoned context output: why a file/block/memory was included.
- Token budget controls for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.
- Smaller generated `CLAUDE.md`/`AGENTS.md` with optional references to larger `agent_docs/` or `.soturail/context/` files.
- A compact structured payload mode for JSON/YAML/log-heavy context where repeated keys or repeated rows waste tokens.

### Context Expert Router

This is not a neural MoE implementation. It is a local routing metaphor: use only the context expert needed for the task.

- `soturail context route --query "..."` as a future alias/layer over `context select`.
- Built-in expert profiles:
  - code expert: source files, symbols, failing tests;
  - docs expert: README, roadmap, usage guides;
  - release expert: changelog, release notes, npm/GitHub state;
  - security expert: raw logs, redaction, policy, secrets;
  - workflow expert: current plan, tasks, verification;
  - memory expert: approved memories and historical decisions.
- Output should include selected expert, included evidence, omitted context and reason.

### Harness Failure Ledger

- `soturail harness note "..."` to record an agent mistake, repeated bug, missed test or bad context decision.
- `soturail harness doctor` to check whether a project has enough rails: short agent docs, safe hooks, context packs, MCP smoke, workflow verification and release evidence.
- Convert harness notes into candidate rules, docs, memory records or workflow verification items.
- Link failures to evidence: raw IDs, commands, files, workflow IDs and release reports.

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

## v0.5.1 - Memory, Context And Agent Docs Polish

- Improve `memory recall` output readability.
- Add examples for project decisions, bug history, recurring test failures and architecture preferences.
- Add clean-folder smoke tests for memory/context flows.
- Improve stale-memory detection and dedupe.
- Improve docs for small `CLAUDE.md` plus larger referenced context files.
- Add migration notes for users coming from v0.4.x.
- Add safer export examples for approved memory only.
- Add `agents lint` docs and examples.
- Add `AUTH.md` scaffold docs if the policy/auth-check work lands in v0.5.0.

## v0.5.2 - Evaluation Suite

- Add benchmark cases for memory recall quality.
- Add benchmark cases for context selection quality.
- Measure not only token savings, but whether selected context preserves the correct file, error, command and rule.
- Add reducer quality checks for npm, Vitest, tsc, Java, Maven/Gradle, Docker, git diff, git status, ESLint and Vite/Next output.
- Add before/after reports for raw context vs selected/pruned context.
- Add small local evaluation fixtures inspired by long-code and SWE-style bug workflows without requiring paid APIs.
- Add context-router quality fixtures: the selected expert must match the task type and preserve expected evidence.
- Add agent-doc hygiene fixtures: short root docs plus referenced larger docs should pass.

## v0.6.0 - Real Agent Runtime Integration

- `soturail agents install --agent claude --dry-run`.
- `soturail agents install --agent cursor --dry-run`.
- `soturail agents install --agent gemini --dry-run`.
- `soturail agents status` and `soturail agents doctor --verbose`.
- `soturail agents capabilities` for a host capability matrix.
- Safer backups before modifying agent config files.
- Host capability matrix for Claude Code, Codex, Gemini CLI, Cursor, Antigravity, OpenCode/Amp/Kiro-style hosts and generic agents.
- Prompt-only fallback remains available for every host.
- Codex and Antigravity stay conservative until stable hook/config surfaces are confirmed.
- Add host-specific docs for short agent files, rules, settings, hooks and context pack exports.

## v0.6.1 - Agent UX Polish

- Better `agents doctor` messages.
- Better copy/paste setup examples per host.
- Tutorial: SotuRail with Claude Code.
- Tutorial: SotuRail with Codex.
- Tutorial: SotuRail with Gemini CLI.
- Tutorial: SotuRail with Cursor.
- Tutorial: SotuRail with Antigravity prompt-only workflow.
- Tutorial: short `CLAUDE.md` plus `agent_docs/` references.

## v0.7.0 - Workflow Rail 2.0

- Workflow templates for `Idea -> PRD -> Issues -> TASKS.md -> TDD -> Deploy`.
- `soturail workflow plan`.
- `soturail workflow tasks`.
- `soturail workflow verify`.
- `soturail workflow issue`.
- `soturail workflow tdd`.
- `soturail workflow release`.
- `soturail workflow trace`.
- `soturail workflow report`.
- `soturail workflow scaffold --type feature|bugfix|release`.
- Optional GitHub Issues integration.
- Worktree-per-task workflows with verification checklists.
- Release workflow reports that connect tests, build, audit, pack and npm/GitHub release state.
- Role-based context packs for planner, executor, reviewer and release-manager.

## v0.8.0 - Knowledge Rail And Project Brain

- Ingest project docs, changelogs, release notes, issues and workflow decisions.
- Extract architecture decisions and recurring bug patterns.
- Build project profiles for agents.
- Rules search with cited source paths and line ranges where possible.
- Stale evidence detection across richer project graphs.
- Safer knowledge-to-rules pipeline.
- Project Brain summaries for architecture, decisions, bugs, releases and recurring commands.
- Connect harness failure notes with knowledge/rules suggestions.

## v0.9.0 - Native Engine Real

- Native stream reducer if benchmarks justify it.
- Native JSON/TOON-style structured reducer if benchmarks justify it.
- Native dedupe/hash engine if benchmarks justify it.
- Native runner remains optional.
- TypeScript fallback remains mandatory.
- Benchmarks must prove native speed/quality gains before the feature is promoted.

## v0.10.0 - Local Reports, Trace Viewer And Dashboard

- `soturail report`.
- `soturail trace list`.
- `soturail trace show`.
- `soturail report serve` or `soturail trace serve` for a local-only HTML view.
- Local HTML reports for token savings, dedupe, memory recall, context selection and release gates.
- Workflow report pages.
- CI failure analysis reports.
- Context router visual report: selected expert, included evidence, omitted context and reasons.
- Policy/MCP exposure report.
- Public demo assets for README and release pages.

## Later Exploration - MCP Apps, AG-UI And Gateway Lite

Future UI and gateway modes can be explored only after memory, context selection, policy and reports are stable.

Possible direction:

- local event records for command outputs, context selection, memory recall and workflow status;
- safe local routing between SotuRail resources and agent hosts;
- MCP Apps / MCP-UI compatible local resources for safe report visualization;
- AG-UI-style event stream only if it remains local, optional and safe;
- no cloud dependency by default;
- no arbitrary shell execution through MCP;
- no production proxy claims until benchmarks and real use justify them.

## v1.0.0 - Stable Context OS

- Stable CLI and local API contracts.
- Stable init/run/expand/stats/reducers/memory/context/MCP/agents/workflow behavior.
- Safe MCP defaults.
- Reliable release workflow.
- Good docs and clean-folder onboarding.
- CI green on Windows, Linux and macOS.
- Long-term compatibility guarantees.

## Internal Module Ideas

These are not separate products yet. They are submodules that can grow inside SotuRail.

- SotuRail Memory: local approved memory for coding agents.
- SotuRail Context Select: query-aware context selection with reasons and line ranges.
- SotuRail Context Router: MoE-inspired routing to the smallest useful context expert.
- SotuRail Harness Ledger: repeated agent mistakes converted into rules, checks and workflow evidence.
- SotuRail Agent Docs Linter: short, useful root agent docs with referenced rich context.
- SotuRail Auth Rail: agent-readable auth docs and local redaction checks.
- SotuRail Mini Structured Payloads: deterministic compact JSON/YAML/log formats.
- SotuRail Agent Reports: what changed, what commands ran, what raw IDs exist and what to do next.
- SotuRail Project Brain: architecture, decisions, bugs, rules and release history.
- SotuRail Local Dashboard: local reports and trace viewer before any gateway mode.
- SotuRail Gateway Lite: future local event router after the core rails mature.

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
