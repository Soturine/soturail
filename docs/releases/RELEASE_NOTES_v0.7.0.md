# SotuRail v0.7.0 - Workflow, Harness And Diagram Rails

SotuRail v0.7.0 deepens the local workflow layer. It adds Workflow Rail 2.0 phases, Harness Rail integration, Diagram Rail commands, `.spec.md` visual contracts and release evidence that points to the new `docs/releases/` release-note source.

## Added

- Added `soturail workflow setup`.
- Added title-based `soturail workflow plan "Task title"` for Workflow Rail 2.0 plans.
- Added `soturail workflow work`, `soturail workflow review --all`, `soturail workflow verify` and `soturail workflow diagram <id>`.
- Added deterministic review perspectives for security, docs, tests, release, context and agent readiness.
- Added `soturail diagram init`, `soturail diagram new <feature>`, `soturail diagram audit <file>`, `soturail diagram validate` and `soturail diagram from-workflow <id>`.
- Added generated `.spec.md` visual contracts with required nodes, transitions, evidence links, validation checklist and known gaps.
- Added v0.7.0 tests for release-note paths, workflow phases, harness doctor integration, diagram commands and evidence contents.

## Changed

- Moved repository release notes from root-level `RELEASE_NOTES_vX.Y.Z.md` files into `docs/releases/`.
- Updated release scripts, release preflight, tests and docs to use `docs/releases/RELEASE_NOTES_vX.Y.Z.md`.
- Improved workflow evidence packs with review/verify artifacts, offload IDs, harness contracts, diagram validation, eval reports and release evidence.
- Improved `harness doctor` so it reports active workflow, contract presence, failure count, latest verification status and suggested prevention action.
- Updated Workflow Rail, Harness Rail, Diagram Rail, spec workflow and release docs for v0.7.0.

## Security

- Workflow verification and evidence remain local and do not publish packages, create GitHub releases or run destructive commands.
- Diagram Rail validates local Markdown/Mermaid files only.
- Harness contracts still validate by default without executing configured shell commands.

## Notes

- Historical npm backfill for v0.5.0, v0.5.1, v0.5.2 and v0.6.0 should use the `backfill` dist-tag only when the historical checkout builds, tests and publishes safely.
- During v0.7.0 prep, v0.5.0 backfill was deferred because the historical checkout hit stale test failures and npm publish required a one-time password.
- SotuRail still does not expose arbitrary shell execution through MCP.
