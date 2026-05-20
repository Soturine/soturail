# Changelog

All notable changes to SotuRail are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning before npm publication.

## [Unreleased]

- No unreleased changes yet.

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
- Soturine fox SVG branding and documentation screenshots.

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
