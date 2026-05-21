# Roadmap

## v0.3.1 - Real Usage And Integration Polish

- Installed clean-folder workflow polish.
- v0.3 docs and examples scaffolded by `soturail init`.
- Richer Skill Rail starter templates and list output.
- MCP JSON-RPC smoke coverage and copyable examples.
- Hooks doctor next-step guidance.

## v0.3.2 - Strong Reducers And Deduplication

- Reducers for npm install, npm test, tsc, Vitest, Java stack traces, Maven/Gradle, git diff, git status, Docker logs, ESLint and Vite/Next build output.
- Block-level dedupe.
- Similar-output dedupe as an experimental conservative mode.
- Benchmark reports with dedupe savings, metadata overhead and net token savings.
- Packed-package verification to prevent package/CLI version drift.

## v0.4.0 - Real Agent Integrations And Workflow Rail

- Agent registry for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.
- Agent prompt/context exports.
- MCP host config helper and smoke command.
- Cursor rule export and Claude safe-hooks/MCP export.
- Workflow Rail local state machine.
- Optional local Git worktree isolation without push or merge.

## v0.5.0 - Native Performance

- Rust reducer improvements.
- TypeScript vs Rust benchmark reports.
- Optional native binaries.
- No Rust required for npm install.

## v0.6.0 - Semantic Memory And Hardened Knowledge Ingestion

- Hardened PDF extraction.
- Optional local embeddings for approved memory and rules.
- Stale evidence detection across richer file graphs.
- Rules search and citation workflows.

## v1.0.0 - Stable API And Plugin Ecosystem

- Stable CLI and local API contracts.
- Plugin and policy pack interfaces.
- Long-term compatibility guarantees.

## Completed

- v0.3.0: Skill Rail, MCP and context packs, including skill validation/export, stdio resources/tools, cache-friendly context packs, hook exports and feature benchmarks.
- v0.2.3: release preflight and CLI/package version synchronization.
- v0.2.2: self-dogfooding and reliability reports.
- v0.2.1: native runner hot path, public polish and Claude hook template.
- v0.2.0: benchmarks, hooks foundation, response compression, Knowledge-to-Rules and memory approval workflow.
