# Roadmap Docs Audit

This audit summarizes the documentation update that aligns SotuRail after the v0.10.1 baseline with the new post-v1 roadmap.

## Scope

Audited Markdown documentation in the repository and updated the docs needed to represent the new staged direction:

```txt
v1.0.0  Stable Context OS
v1.1.0  Host Compatibility Rail
v1.2.0  Spec, Design And Diagram Rail
v1.3.0  Knowledge Graph Rail
v1.4.0  Skill Rail 2.0 And Domain Skill Packs
v1.5.0  Governance And Cost Rail
```

## Main Updates

| File | Purpose |
| --- | --- |
| `ROADMAP.md` | Replaced the loose post-v0.10 direction with staged v1.0-v1.5 milestones and expanded the docs coverage matrix. |
| `README.md` | Updated near-term roadmap and future docs links. |
| `CHANGELOG.md` | Added unreleased documentation-change notes. |
| `docs/future-rails-index.md` | Added the new planned rails and post-v1 version summaries. |
| `docs/ecosystem-influences.md` | Added the external project audit summary and product-rule implications. |
| `docs/comparisons.md` | Added a 2026 repository audit comparison table and roadmap mapping. |
| `docs/external-projects-audit.md` | New detailed audit of referenced repositories and what SotuRail should absorb. |
| `docs/host-compatibility-rail.md` | New v1.1 rail plan for OpenCode, Antigravity, Deep Agents-style, Claude, Codex, Cursor and generic hosts. |
| `docs/design-rail.md` | New v1.2 design guidance plan based on local `DESIGN.md`, lint, diff and export ideas. |
| `docs/knowledge-graph-rail.md` | New v1.3 graph plan connecting Project Brain, reverse specs, workflows, diagrams and releases. |
| `docs/skill-rail-2.md` | New v1.4 domain skill plan with safety boundaries. |
| `docs/governance-cost-rail.md` | New v1.5 governance/cost guardrail plan. |
| `docs/stable-command-surface.md` | Added post-v1 candidate rail clarification. |
| `docs/migration-v1.md` | Added post-v1 sequence notes. |
| `docs/skill-rail.md` | Added pointer to Skill Rail 2.0. |
| `docs/code-graph.md` | Added pointer to Knowledge Graph Rail. |
| `docs/diagram-rail.md` | Added connection to Spec and Design Rail. |

## Audit Result

- Markdown files scanned: 137.
- Internal Markdown links: checked for local path existence; no missing internal Markdown links were found after the update.
- External links: left as references; not fetched during the local audit.
- Release notes path convention remains `docs/releases/RELEASE_NOTES_vX.Y.Z.md`.
- Root-level release notes were not added.
- Code files were not changed.
- The update intentionally documents future rails only; it does not claim those commands already exist.

## Alignment Check

The updated docs keep these product boundaries:

- SotuRail is not the agent runtime.
- SotuRail is not a cloud dashboard.
- SotuRail is not a tool marketplace.
- SotuRail is not a Mermaid-only CLI.
- SotuRail is not a security bypass/exploitation automation tool.
- SotuRail remains local-first, npm-friendly, safe-by-default and evidence-driven.

## Follow-Up For v1.0.0

Before freezing v1.0.0, use the docs above to decide:

- which commands are in the stable surface;
- which commands remain experimental;
- which schemas are compatibility commitments;
- whether Project Brain evidence needs a refresh;
- whether report/status/readiness output is clean enough for a stable release;
- whether Host Compatibility, Design, Graph, Skill Rail 2.0 and Governance/Cost stay post-v1.

## Scope Isolation Audit

This update was rechecked to make sure the roadmap package is for SotuRail only.

Checked signals:

- no financial-market execution roadmap sections;
- no trading/backtest/DuckDB/risk-firewall milestone language;
- no passive-income, dividend, broker, Forex, FII or exchange-roadmap terms;
- no cloud telemetry, destructive MCP tool, security-bypass or exploitation automation goals;
- no source-code changes;
- documentation-only update package.

The updated direction remains:

```txt
v1.0.0  Stable Context OS
v1.1.0  Host Compatibility Rail
v1.2.0  Spec, Design And Diagram Rail
v1.3.0  Knowledge Graph Rail
v1.4.0  Skill Rail 2.0 And Domain Skill Packs
v1.5.0  Governance And Cost Rail
```

If future documentation mentions market, broker, strategy, trading or exchange concepts, it should be rejected from this repository unless the text is only describing external-tool compatibility in a clearly non-financial sense.

