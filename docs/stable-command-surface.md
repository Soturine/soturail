# Candidate Stable Command Surface

This document is a v1.0 draft, not a final stability promise.

SotuRail v0.10.1 starts separating the candidate stable surface from experimental and advanced areas so v1.0 can freeze the right contracts without removing useful local-first rails.

## Stable Candidate

- `soturail status`
- `soturail report`
- `soturail dashboard`
- `soturail obs`
- `soturail brain`
- `soturail eval`
- `soturail bench`
- `soturail native`
- `soturail self baseline`
- `soturail self schemas --check`
- `soturail self readiness --v1`
- `soturail release check`
- `soturail workflow`
- `soturail harness`
- `soturail diagram`
- `soturail agents`

## Experimental

- graph and parse seeds
- native acceleration beyond candidate reporting
- extended MCP tools beyond read-only report resources
- future dashboard server modes
- large parser integrations

Experimental commands can change before v1.0. They should stay local, optional and documented.

## Internal Or Advanced

- reducer benchmark internals
- native build commands
- low-level MCP smoke/serve flows
- self dogfood helpers
- raw log expansion and internal evidence stores

Advanced commands should remain available for development and diagnostics, but they are not the first v1.0 compatibility promise.

## Deprecated

No public commands are deprecated in v0.10.1.

If a command becomes deprecated later, release notes must name the replacement command and the planned removal window.

## v1.0 Rule

v1.0 will freeze only the documented stable surface. Experimental commands remain useful, but their contracts can still evolve with clear release-note warnings.

## Post-v1 Candidate Rails

The v1.0 stable surface should not accidentally freeze every future idea. The following rails are planned as post-v1 candidates and should remain clearly documented as future or experimental until implemented and tested:

- Host Compatibility Rail for OpenCode, Antigravity, Deep Agents-style and generic host exports.
- Spec, Design And Diagram Rail for `PRD.md`, `requirements.md`, `design.md`, `tasks.md`, `DESIGN.md` and Mermaid visual contracts.
- Knowledge Graph Rail for local graph build/explain/impact/tour outputs.
- Skill Rail 2.0 for domain skill templates, skill eval and role-aware exports.
- Governance And Cost Rail for context budget, dynamic workflow and MCP/skill exposure warnings.
