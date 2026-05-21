# Changelog

All notable changes to SotuRail are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning before npm publication.

## [Unreleased]

### Added

- v0.2.2 Self-Dogfooding & Reliability work in progress.
- Added self-dogfooding command namespace.
- Added self-dogfood markdown report.
- Added build/test/bench orchestration through SotuRail itself.
- Expanded benchmark categories and fixtures.
- Added Windows usage documentation.
- Added Skill Rail and Workflow Rail planning docs.

### Changed

- Improved tiny-output compression accounting.

## [0.2.1] - 2026-05-20

### Added

- First public npm release as `soturail`.
- Installation via `npx soturail` and `npm install -g soturail`.
- Native Rust `reduce-json` command.
- Native Rust `run` hot path with tee-stream raw logging and JSON summary sidecar.
- Benchmark categories for terminal compression, agent response compression, JSON/tool payload compression, knowledge structuring and native performance.
- Engine comparison command for TypeScript and native benchmarks.
- Real Claude hook template installer with `.claude/settings.json` and hook script generation.
- Branding documentation and cleaner transparent SVG assets.

### Changed

- JSON reducer now emits compact path/value summaries for noisy tool payloads.
- Knowledge-to-Rules benchmarks are reported as reusable structuring, not failed compression.
- Native explicit mode now fails clearly when the native binary is unavailable.
- Removed the low-value non-technical discovery keyword/topic from package metadata.

### Fixed

- Fixed npm `bin` metadata so the `soturail` CLI resolves correctly through `npx` and global installs.

## [0.2.0] - 2026-05-20

### Added

- Optional std-only Rust reducer crate and native engine detection.
- `soturail run --engine auto|ts|native` and `soturail native doctor`.
- Reproducible benchmark fixtures, JSON results and Markdown reports.
- Stronger terminal reducers and cross-call output dedupe.
- Agent response compression modes through `soturail format`.
- Knowledge-to-Rules ingestion, exports and deterministic validators.
- Agent hook installers with dry-run, backups and prompt-only fallback.
- Expanded Spec-Driven Development commands and validation.
- Pending/approved memory workflow with stale detection.
- CI workflow for Node 20/22 across Linux, macOS and Windows.
- Fox SVG branding and documentation screenshots.

### Changed

- README, roadmap, security and contribution docs now describe v0.2.0 public repository behavior.
- Prompt cache block names now match the stable payload order: `static_header`, `governance`, `config`, `repo_map`, `approved_specs`, `approved_memory`, `dynamic_footer`.

## [0.1.0] - 2026-05-20

### Added

- Initial local-first CLI foundation.
- Workspace initialization, indexing, progressive reading, safe command running and raw expansion.
- Spec, memory, doctor, cache and stats commands.
- Vitest coverage for MVP behavior.
- English-first documentation with pt-BR overview.
