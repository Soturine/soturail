# Changelog

All notable changes to SotuRail are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning before npm publication.

## [Unreleased]

### Changed

- Updated the roadmap after the v0.10.1 baseline to stage v1.0.0 stabilization followed by Host Compatibility, Spec/Design, Knowledge Graph, Skill Rail 2.0 and Governance/Cost rails.
- Added docs for external project audit findings, Host Compatibility Rail, Design Rail, Knowledge Graph Rail, Skill Rail 2.0, Governance And Cost Rail and roadmap docs audit.
- Updated future-rails, comparisons, ecosystem and README docs to align with the new post-v1 roadmap.

## [0.10.1] - 2026-05-31

### Fixed

- Fixed and hardened JSON output contracts so `status --json` and local JSON artifacts are emitted through `JSON.stringify` and covered by parseability tests.
- Added release-preflight validation for invalid local JSON artifacts before publish.

### Added

- Added `self schemas --check` and `self schemas --check --json` for local schema compatibility checks.
- Added `self readiness --v1` and `self readiness --v1 --json` for candidate v1.0 readiness reporting.
- Added v1 preparation docs: stable command surface draft, deprecation policy and migration-to-v1 draft.
- Added v0.10.1 contract tests for status/report/MCP/bench/native/baseline JSON, redaction, observability de-duplication and readiness output.

### Changed

- Improved report latest, report doctor, report diff, agent reports and dashboard cards with clearer next commands and Project Brain stale/suspect guidance.
- Improved dashboard doctor with local JSON parseability checks.
- Improved observability collection with stable event IDs, duplicate skipping, sorted timelines and richer summaries.
- Improved benchmark/native/baseline messaging around stale reports, TypeScript fallback, normal npm installs and clean baseline guidance.
- Improved baseline snapshot warnings for missing GitHub files, release notes, dirty trees, version mismatch and npm pack contents.

### Security

- Report redaction now describes redaction kinds without printing secret values and avoids treating normal package hashes as secrets.
- v0.10.1 does not add cloud, telemetry upload, server mode, destructive MCP tools or breaking command removals.

## [0.10.0] - 2026-05-31

### Added

- Added unified local status artifacts through `status --json`, `status --md` and `status --agent`.
- Added Report Rail commands for build, latest, export, doctor, redact, GitHub summary, agent reports and report diffs.
- Added static local dashboard commands: `dashboard build`, `dashboard open` and `dashboard doctor`.
- Added local observability commands: `obs collect`, `obs summary`, `obs timeline` and `obs export`.
- Added read-only MCP report resource manifest generation with `mcp resources report`.
- Added report redaction and safety checks for obvious token, key and secret patterns.
- Added v0.10.0 docs for status, reports, dashboard, observability, agent-readable reports, MCP report resources and redaction.

### Changed

- Release preflight now checks report redaction safety and references optional status/report/dashboard/observability/MCP evidence.
- Workflow evidence now references local status, report, dashboard, observability and MCP report resource artifacts when present.
- README and roadmap now frame v0.10.0 as local reports before dashboards: no cloud, no telemetry and no server requirement.

### Security

- Static dashboard output has no external CDN/script dependencies and `dashboard doctor` flags external references.
- Report redaction is conservative and avoids exposing obvious fake or real credentials in report handoffs.
- MCP report resources are read-only and do not expose shell execution or report mutation.

## [0.9.0] - 2026-05-31

### Added

- Added Benchmark Rail 2.0 commands: `bench list`, suite-aware `bench run`, `bench compare` and stable `.soturail/bench/latest.*` reports.
- Added lightweight benchmark categories for Project Brain, reducers, JSONL, range hashing, file scanning, workflow evidence, format comparison, JSON validation and release preflight.
- Added `native candidates`, `native candidates --json`, `native status` and `native compare` with benchmark-gated candidate classifications and TypeScript fallback reporting.
- Added `self baseline --check|--zip|--bundle|--pack` for clean source archives, git bundles and npm package snapshots.
- Added benchmark, native candidate and baseline report references to workflow and release evidence.
- Added native performance policy, baseline snapshot and experimental code-graph planning docs.

### Changed

- Improved `native doctor` with benchmark report and candidate-report guidance.
- Improved `bench report` to prefer the new Benchmark Rail 2.0 report while preserving the legacy reducer report fallback.
- Release preflight now treats TypeScript fallback as a required release gate and native availability as optional evidence.

### Security

- Native acceleration remains optional and benchmark-gated. Normal npm install does not require Rust, Cargo or native build tools.
- SotuRail does not claim native speedups unless a local benchmark report proves them.
- Parser/graph work remains a local experimental seed and does not add a graph database, embeddings, cloud service or external LLM dependency.

## [0.8.1] - 2026-05-27

### Added

- Added `brain consolidate --dry-run` with consolidated claim views and Markdown/JSON reports.
- Added stale repair plans through `brain stale --repair-plan` and `brain doctor --repair-plan`.
- Added source-range relocation events when moved evidence can still be matched deterministically.
- Added v0.8.1 Project Brain evaluation cases for deduplication, repair guidance, brief safety, source relocation, rule links, doctor actionability and section limits.

### Changed

- Improved Project Brain agent briefs with bounded sections, verified/suspect/stale separation, current release process, critical commands, recovery pointers and source references.
- Improved `rules from-brain` so stale/suspect claims are excluded from active rules and generated rules link to source claims or decisions.
- Improved `rules doctor`, `brain doctor`, Harness Rail guidance and workflow evidence with stronger Project Brain health signals.
- Updated Project Brain, Knowledge-to-Rules, agent, workflow, harness and evaluation docs with troubleshooting guidance.

### Security

- v0.8.1 does not auto-repair code, docs or claims. Repair plans are guidance for human review.
- Project Brain remains local, deterministic and evidence-first: no LLM calls, embeddings, cloud service or network-required tests.

## [0.8.0] - 2026-05-27

### Added

- Added Verified Project Brain storage under `.soturail/brain/` with JSONL claims, decisions, bugs, gaps, rules and stale events.
- Added JSON materialized views for project profile, architecture, brain index, freshness and doctor reports.
- Added `brain init`, `brain scan`, `brain profile`, `brain recall`, `brain stale`, `brain doctor` and `brain export --agent <host>`.
- Added Reverse Specification Rail commands: `reverse scan`, `reverse claims`, `reverse specs`, `reverse gaps` and `reverse export --target agent`.
- Added `rules from-brain` and `rules doctor` for reviewed brain-derived operational rules.
- Added `eval run --suite brain` and v0.8 brain/reverse smoke coverage.
- Added Project Brain, Reverse Specification Rail and Knowledge To Rules docs.

### Changed

- Agent exports and status guidance now point to Project Brain briefs when useful.
- Workflow evidence now includes Project Brain profile and claim/gap/stale counts when available.
- Evaluation docs now cover the brain suite.

### Security

- Project Brain is local and deterministic: no LLM calls, embeddings, cloud service, network-required tests or mandatory database.
- Brain exports include source references and stale/suspect warnings, and remain review-required before agent handoff.

## [0.7.0] - 2026-05-26

### Added

- Added Workflow Rail 2.0 phase commands: `workflow setup`, title-based `workflow plan`, `workflow work`, `workflow review --all`, `workflow verify` and `workflow diagram`.
- Added deterministic workflow review perspectives for security, docs, tests, release, context and agent readiness.
- Added Diagram Rail commands: `diagram init`, `diagram new`, `diagram audit`, `diagram validate` and `diagram from-workflow`.
- Added generated `.spec.md` visual contracts for diagrams.
- Added focused v0.7.0 tests for release-note paths, workflow phases, harness doctor integration, diagram commands and evidence contents.

### Changed

- Moved release notes into `docs/releases/` and updated release scripts, tests and docs to read `docs/releases/RELEASE_NOTES_vX.Y.Z.md`.
- Improved workflow evidence with review/verify artifacts, offload IDs, harness contract status, diagram validation, evaluation reports and release evidence.
- Improved `harness doctor` with active workflow, contract presence, failure count, latest verification status and suggested prevention action.
- Updated Workflow Rail, Harness Rail, Diagram Rail, spec workflow and release docs for v0.7.0.

### Security

- Workflow verification and diagram validation remain local and do not publish packages, create GitHub releases or run destructive commands.
- Harness contracts still validate by default without executing configured commands.

## [0.6.1] - 2026-05-26

### Added

- Added `soturail eval list`, `soturail eval run` and `soturail eval report` for deterministic local evaluation fixtures.
- Added evaluation coverage for memory recall, context selection, reducers, context routing, role packs, agent-doc hygiene, offload/restore, payload format quality, strict JSON validation, evidence packs, harness scenarios and Diagram Rail validation.
- Added host setup tutorials for Claude Code, Codex, Gemini CLI, Cursor, Antigravity prompt-only workflows, Deep Agents-style role packs, harness workflows, Diagram Rail specs and context formats.
- Added backfilled release notes for v0.5.0 and v0.5.1 so historical GitHub releases can use matching notes files.

### Changed

- Improved `agents doctor`, `agents doctor --verbose`, `agents status`, `agents capabilities` and `agents explain` with clearer next steps, host setup examples, role/context pack guidance and policy reminders.
- Expanded evaluation and benchmarking docs to distinguish token savings from quality preservation.
- Improved workflow evidence packs with changed-file and harness-contract sections.
- Tightened deterministic context routing for code, docs and research queries.

### Security

- Evaluation fixtures remain local-only and do not require network calls, paid APIs, GitHub access, real agent hosts or npm publishing.
- Agent UX guidance continues to default to dry-run, backup-first, project-local installs and no arbitrary MCP shell execution.

## [0.6.0] - 2026-05-26

### Added

- Added `soturail agents capabilities` and `soturail agents capabilities --json` for a host capability matrix.
- Added `soturail agents status` and `soturail agents status --json` for local agent file, export, context, policy and run workspace inspection.
- Added verbose agent doctor output with host capabilities, payload guidance, policy notes and dry-run install suggestions.
- Added experimental `deepagents` and `deepagents-js` agent export targets as context/config artifacts only.
- Added v0.6.0 runtime integration tests for capabilities, status, verbose doctor, dry-run installs, backups and Deep Agents-style exports.

### Changed

- Expanded agent profiles to include OpenCode-style, Amp-style, Kiro-style, Deep Agents-style and Deep Agents JS-style targets.
- Improved agent install dry-runs so they show planned files, backup behavior, context references, payload recommendations, policy warnings and next apply commands.
- Improved generated agent exports with host-aware payload recommendations and policy notes.
- Updated agent runtime, MCP, context pack, policy and structured payload docs for v0.6.0 host-aware setup.

### Security

- Agent installs remain project-local, dry-run/backup-first and review-first.
- SotuRail still does not expose arbitrary shell execution through MCP.
- Deep Agents-style exports do not install dependencies, start autonomous runtimes or claim direct runtime integration.

## [0.5.2] - 2026-05-26

### Added

- Added lightweight v0.5.2 quality fixtures for JSON validation, format comparison, context routing, context budget, workflow evidence, run workspace output and agent docs hygiene.
- Added release notes for the v0.5.2 stabilization milestone.

### Changed

- Updated release reliability tests so package, lockfile, CLI, changelog and release notes sync with the current package version instead of stale hardcoded versions.
- Updated agent integration tests so `agents doctor` expectations validate stable behavior rather than old exact wording.
- Realigned the roadmap so v0.5.2 is CI stabilization and lightweight quality fixtures, while the full evaluation suite moves to v0.6.1.

### Security

- v0.5.2 does not add publish, release, network, native-binary or heavy benchmark requirements.

## [0.5.1] - 2026-05-26

### Added

- Added a light `soturail validate json <file> --strict` seed for JSON parse, duplicate-key, probable-secret and huge-array checks.
- Added a light `soturail format compare <file>` seed for Markdown, JSON, tagged-block and compact-format handoff hints.
- Added v0.5 migration notes for moving from v0.4.x to v0.5.x rails.
- Added structured payload and Diagram Rail examples for v0.5.1 planning.

### Changed

- Improved Memory Rail recall output with score, reason, source, tags, confidence and privacy details.
- Improved Memory Rail doctor output with storage, consolidated count, secret hints and approved-memory export guidance.
- Improved Context Intelligence output with recovery pointers, clearer prune sections and richer budget drivers.
- Improved Run Workspace show/clean output with summary, handoff, evidence and linked artifact status.
- Expanded docs for role packs, agent docs hygiene, approved-memory export and clean-folder onboarding.

### Security

- JSON validation warns about probable secrets before agent handoff.
- Format comparison and structured payload docs recommend redaction, offload and review for large or sensitive payloads.
- No publish, release or arbitrary MCP shell execution behavior changed.

## [0.5.0] - 2026-05-26

### Added

- Added Memory Rail commands for remember, recall, capture, consolidate and doctor.
- Added Context Intelligence commands for select, prune, route, budget, offload and restore.
- Added role-based context packs for planner, executor, reviewer, release-manager and researcher.
- Added Harness Failure Ledger and acceptance contract seed commands.
- Added Policy Approval Queue and policy doctor/validate commands.
- Added Filesystem Evidence Rail snapshot, touched, diff and plan-edit commands.
- Added agent docs hygiene lint, split-context and explain commands.
- Added Skill Boundary Rail suggest and route commands.
- Added MCP exposure report with JSON output.
- Added Run Workspace Rail seed commands under `soturail run workspace`.
- Added Workflow Evidence Pack seed and native doctor fallback diagnostics.

### Changed

- Updated docs to reflect the v0.5.0 MVP rail seeds and the refreshed roadmap.
- Context packs now support role-oriented packs in addition to agent-target packs.

### Security

- MCP still does not expose arbitrary shell execution by default.
- Raw/offloaded context is redacted for probable secrets before reports.
- Risky local actions are represented through policy queue records and explicit decisions.
- Native acceleration remains optional; TypeScript fallback stays available.

## [0.4.1] - 2026-05-22

### Added

- Added v0.4 agent and workflow docs to the `soturail init` scaffold.
- Added agent examples to the `soturail init` scaffold.
- Added workflow examples to the `soturail init` scaffold.
- Added `.gitattributes` to reduce line-ending noise on Windows.
- Added release/preflight protection for required GitHub workflow files.

### Changed

- Improved `soturail agents doctor` next-step guidance.
- Improved Workflow Rail list/show/close UX.
- Updated generated docs to avoid stale fixed-version language.
- Improved first clean project documentation.

### Fixed

- Fixed incomplete v0.4 scaffold output from `soturail init`.
- Fixed stale generated text referencing older SotuRail versions.
- Fixed stale MCP message that referenced v0.3.0.

### Security

- Agent and workflow polish keeps dry-run-first and safe-default behavior.
- No arbitrary shell execution is exposed through MCP.

## [0.4.0] - 2026-05-21

### Added

- Added agent integration registry and exports.
- Added agent-specific prompt/context exports for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.
- Added MCP host configuration helpers.
- Added MCP smoke command.
- Added Workflow Rail with local task state.
- Added optional Git worktree task isolation.
- Added agent integration examples and workflow examples.

### Changed

- Improved hooks dry-run, export and doctor guidance.
- Improved context packs with agent-specific targets and `--target all`.
- Improved installed user experience for agent integration setup.

### Fixed

- Strengthened release package verification to prevent stale CLI/package version mismatches.

### Security

- MCP still does not expose arbitrary shell execution by default.
- Agent config install remains dry-run-first and backup-first.
- Workflow Rail does not push, merge or delete user work without explicit confirmation.

## [0.3.3] - 2026-05-21

### Fixed

- Fixed packed package CLI verification so release gates execute the CLI installed from the generated `.tgz`.
- Avoided npm cache, `npx`, `npm exec` and global CLI false positives in release verification.

### Changed

- Release verification now installs the packed `.tgz` into a clean temporary project and executes `node_modules/soturail/dist/cli.js`.
- Added clearer diagnostics for package verification failures in local and GitHub Actions logs.

### Security

- Runtime audit remains enforced with `npm audit --omit=dev`.

## [0.3.2] - 2026-05-21

### Added

- Added package verification gate that installs the packed tarball in a clean temporary directory before release.
- Added stronger reducers for common developer outputs.
- Added block-level deduplication.
- Added dedupe statistics.
- Added expanded reducer benchmark cases.
- Added safer raw log redaction for `soturail expand`.

### Changed

- Improved `soturail stats` with reducer, dedupe and metadata accounting.
- Improved benchmark reports with net token savings and dedupe savings.
- Improved release validation to prevent package/CLI version mismatch.

### Fixed

- Fixed release process gap where a published package could pass local version checks but still ship stale CLI metadata.
- Fixed reducer behavior for noisy command outputs where important failures could be buried.

### Security

- Raw log expansion redacts probable secrets by default.
- Full raw output requires explicit opt-in.

## [0.3.1] - 2026-05-21

### Added

- Added v0.3 scaffolding to `soturail init`.
- Added first real workflow documentation.
- Added examples for skills, context packs, MCP and hooks.
- Added clean-folder smoke test coverage.
- Added MCP stdio smoke coverage.

### Changed

- Improved `soturail skills list` output.
- Improved starter skill template generated by `soturail skills init`.
- Improved `soturail hooks doctor` with safe next steps.
- Improved documentation for MCP, context packs and installed usage.

### Fixed

- Fixed incomplete v0.3 docs scaffolding in `soturail init`.

### Security

- MCP remains read-oriented and does not expose arbitrary shell execution.
- Hook commands continue to prefer dry-run, backups and human review.

## [0.3.0] - 2026-05-21

### Added

- Added Skill Rail with `soturail skills init`, validation, export and pack commands.
- Added local MCP-compatible JSON-RPC stdio server with read-only resources and safe tools.
- Added cache-friendly context pack builder for Claude, Codex, Gemini, Cursor and generic targets.
- Added v0.3 benchmark categories for Skill Rail, MCP, context packs, hook export and memory workflow.
- Added release automation commands for preflight, npm publish and GitHub release steps.
- Added v0.3.0 release notes.

### Changed

- Strengthened hook command shape with `--agent`, `--mode`, dry-run and export support.
- Expanded release checks to guard pack contents and prevent raw log artifacts in npm packages.
- Updated documentation for Skill Rail, MCP, context packs, comparisons and release workflow.

### Fixed

- Kept CLI version sync through the generated version source introduced in v0.2.3.

### Security

- MCP does not expose arbitrary shell execution in v0.3.0.
- MCP raw log expansion redacts probable secrets unless explicitly requested with `allow_raw=true`.
- Skill validation checks for prompt-injection style instructions, destructive commands and probable embedded secrets.

## [0.2.3] - 2026-05-21

### Fixed

- Fixed stale CLI version output after npm publish.
- Ensured CLI version is derived from package metadata through a single generated source of truth.

### Added

- Added release preflight validation to catch version mismatches before publish.
- Added tests for CLI/package version synchronization.
- Added release notes for v0.2.3.

### Changed

- Improved release process documentation for npm and GitHub releases.

## [0.2.2] - 2026-05-21

### Added

- Added `soturail self` namespace.
- Added `soturail self all`.
- Added self-dogfooding report generation at `.soturail/reports/self-dogfood.md`.
- Added cache-friendly self-report structure with stable project data before dynamic execution data.
- Added expanded benchmark categories.
- Added Windows usage documentation.
- Added Skill Rail and Workflow Rail planning documentation.

### Changed

- Improved release validation flow around build, tests, audit, benchmarks and self-dogfooding.
- Improved stats accounting for tiny terminal outputs.

### Fixed

- Stats now reports when compression is not effective for tiny command outputs because metadata overhead is larger than the raw output.

### Security

- Runtime package audit remains clean with `npm audit --omit=dev`.
- Documented how to evaluate development-only audit findings without using `npm audit fix --force` blindly.


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
