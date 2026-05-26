# SotuRail v0.5.0 - Local Rail MVP

SotuRail v0.5.0 introduced the first local rail MVP for memory, context intelligence, role packs, harness evidence, policy queues, filesystem evidence, run workspaces and optional native diagnostics.

## Highlights

- Memory Rail commands for remember, recall, capture, consolidate and doctor.
- Context Intelligence commands for select, prune, route, budget, offload and restore.
- Role-based context packs for planner, executor, reviewer, release-manager and researcher.
- Harness Failure Ledger and acceptance contract seed commands.
- Policy Approval Queue and policy doctor/validate commands.
- Filesystem Evidence Rail snapshot, touched, diff and plan-edit commands.
- Agent docs hygiene lint, split-context and explain commands.
- Skill Boundary Rail suggest and route commands.
- MCP exposure report with JSON output.
- Run Workspace Rail seed commands under `soturail run workspace`.
- Workflow Evidence Pack seed and native doctor fallback diagnostics.

## Security

SotuRail remains local-first and safe-by-default. MCP does not expose arbitrary shell execution by default, raw/offloaded context is redacted for probable secrets before reports, and native acceleration remains optional.
