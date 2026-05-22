# Roadmap

SotuRail is evolving toward a local-first Context OS for AI coding agents: context packs, reducers, dedupe, memory, MCP resources, agent exports, workflows, and safe release gates in one small CLI.

This roadmap keeps the historical plan intact while updating the next major direction after the v0.4.x agent-integration milestone.

## Roadmap Policy

- Prefer small patch releases after large feature releases.
- Do not publish a GitHub release before the npm package is published successfully.
- Keep runtime usage clean: `npm audit --omit=dev` must remain at `0 vulnerabilities` before publish.
- Treat full-audit Vitest/Vite/esbuild findings as dev-only unless they affect packed/runtime users.
- Do not expose arbitrary shell execution through MCP by default.
- Keep native acceleration optional. A TypeScript fallback must always work.
- Every major feature should have clean-folder smoke tests, Windows coverage, docs, release notes, and package/CLI version verification.

## v0.5.0 - Memory Rail, Context Intelligence And Native Reliability

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
- Memory records with source, path, confidence, tags, timestamps and privacy flags.
- Approved-memory-only mode for agent/MCP exposure.
- Redaction before storage and before MCP/resource export.

### Context Intelligence

- `soturail context select --query "..."` to choose the best repo/docs/memory/rules context for a task.
- `soturail context prune` to reduce context while preserving files, line ranges and reasons.
- Local ranking that combines keyword matches, file paths, recent workflow state, approved memory and rules.
- Reasoned context output: why a file/block/memory was included.
- Token budget controls for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.
- Smaller generated `CLAUDE.md`/`AGENTS.md` with optional references to larger `agent_docs/` or `.soturail/context/` files.

### Native Reliability, Not Native-Only

- Improve optional native reducer hot paths only where benchmarks prove a bottleneck.
- Add TypeScript vs native benchmark reports.
- Keep Rust/native binaries optional.
- Keep npm install working without Rust, Cargo or native build tools.
- Expand `soturail native doctor` and fallback diagnostics.

### Governance And Safety

- Add local policy checks for secrets, unsafe raw expansion and MCP resource exposure.
- Maintain default safe behavior: raw logs require explicit `--allow-raw --yes` style confirmation.
- Add docs comparing SotuRail memory/context behavior with agent-memory style tools without claiming unsupported superiority.

## v0.5.1 - Memory And Context Polish

- Improve `memory recall` output readability.
- Add examples for project decisions, bug history, recurring test failures and architecture preferences.
- Add clean-folder smoke tests for memory/context flows.
- Improve stale-memory detection and dedupe.
- Improve docs for small `CLAUDE.md` plus larger referenced context files.
- Add migration notes for users coming from v0.4.x.

## v0.5.2 - Evaluation Suite

- Add benchmark cases for memory recall quality.
- Add benchmark cases for context selection quality.
- Measure not only token savings, but whether selected context preserves the correct file, error, command and rule.
- Add reducer quality checks for npm, Vitest, tsc, Java, Maven/Gradle, Docker, git diff, git status, ESLint and Vite/Next output.
- Add before/after reports for raw context vs selected/pruned context.

## v0.6.0 - Real Agent Runtime Integration

- `soturail agents install --agent claude --dry-run`.
- `soturail agents install --agent cursor --dry-run`.
- `soturail agents install --agent gemini --dry-run`.
- `soturail agents status` and `soturail agents doctor --verbose`.
- Safer backups before modifying agent config files.
- Host capability matrix for Claude Code, Codex, Gemini CLI, Cursor, Antigravity and generic agents.
- Prompt-only fallback remains available for every host.
- Codex and Antigravity stay conservative until stable hook/config surfaces are confirmed.

## v0.6.1 - Agent UX Polish

- Better `agents doctor` messages.
- Better copy/paste setup examples per host.
- Tutorial: SotuRail with Claude Code.
- Tutorial: SotuRail with Codex.
- Tutorial: SotuRail with Gemini CLI.
- Tutorial: SotuRail with Cursor.
- Tutorial: SotuRail with Antigravity prompt-only workflow.

## v0.7.0 - Workflow Rail 2.0

- Workflow templates for `Idea -> PRD -> Issues -> TASKS.md -> TDD -> Deploy`.
- `soturail workflow plan`.
- `soturail workflow tasks`.
- `soturail workflow verify`.
- `soturail workflow issue`.
- `soturail workflow tdd`.
- `soturail workflow release`.
- Optional GitHub Issues integration.
- Worktree-per-task workflows with verification checklists.
- Release workflow reports that connect tests, build, audit, pack and npm/GitHub release state.

## v0.8.0 - Knowledge Rail And Project Brain

- Ingest project docs, changelogs, release notes, issues and workflow decisions.
- Extract architecture decisions and recurring bug patterns.
- Build project profiles for agents.
- Rules search with cited source paths and line ranges where possible.
- Stale evidence detection across richer project graphs.
- Safer knowledge-to-rules pipeline.

## v0.9.0 - Native Engine Real

- Native stream reducer if benchmarks justify it.
- Native JSON/TOON-style structured reducer if benchmarks justify it.
- Native dedupe/hash engine if benchmarks justify it.
- Native runner remains optional.
- TypeScript fallback remains mandatory.
- Benchmarks must prove native speed/quality gains before the feature is promoted.

## v0.10.0 - Local Reports And Dashboard

- `soturail report`.
- Local HTML reports for token savings, dedupe, memory recall, context selection and release gates.
- Workflow report pages.
- CI failure analysis reports.
- Public demo assets for README and release pages.

## v1.0.0 - Stable Context OS

- Stable CLI and local API contracts.
- Stable init/run/expand/stats/reducers/memory/context/MCP/agents/workflow behavior.
- Safe MCP defaults.
- Reliable release workflow.
- Good docs and clean-folder onboarding.
- CI green on Windows, Linux and macOS.
- Long-term compatibility guarantees.

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
